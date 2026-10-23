// Simulated Arduino Uno core. Compiled once to core.o and linked with every sketch.
// Serial output goes to stdout. Pin activity and checker results go to stderr as
// one-line events that the website parses:
//   M pin mode t   pinMode          D pin val t   digitalWrite
//   A pin val t    analogWrite      T pin hz t    tone (hz 0 = noTone)
//   B baud t       Serial.begin     R pin count   reads per pin (at end)
//   V pin angle t  servo position
//   w code pin     warning          X reason t    simulation ended
//   PASS id / FAIL id :: got        checker results
// t is simulated time in microseconds.
#include "Arduino.h"
#include "Servo.h"
#include <unistd.h>
#include <ctype.h>
#include <stdarg.h>

HardwareSerial Serial;

// ── Simulation state ────────────────────────────────────────
static uint64_t now_us = 0;
static uint64_t limit_us = 10000000ULL;
static const int NPINS = 20;
static int pin_mode[NPINS];
static int pin_out[NPINS];
static int pin_tone[NPINS];
static unsigned long pin_reads[NPINS];
static int pin_rises[NPINS];
static bool warned_output[NPINS];
static bool warned_pwm[NPINS];
static bool serial_begun = false, warned_begin = false, warned_badpin = false;
static unsigned long out_bytes = 0, events = 0, loops = 0;
static const unsigned long MAX_OUT = 60000, MAX_EVENTS = 20000;
static bool capturing = false;
static String *capture_buf = 0;
static bool test_mode = false;

struct Sched { int pin; uint64_t t; int val; };
static Sched dsched[64]; static int nd = 0;
static Sched asched[64]; static int na = 0;
struct SerIn { uint64_t t; char *text; unsigned pos; };
static SerIn serin[16]; static int nser = 0;

static void ev(const char *fmt, ...) __attribute__((format(printf, 1, 2)));
static void flush_reads();
static void stop(const char *reason);

static void ev(const char *fmt, ...) {
  char b[160];
  va_list ap; va_start(ap, fmt);
  int n = vsnprintf(b, sizeof b, fmt, ap);
  va_end(ap);
  if (n > 0) ::write(2, b, n < (int)sizeof b ? n : (int)sizeof b - 1);
}

static void count_event() {
  if (++events > MAX_EVENTS) stop("events");
}

static void stop(const char *reason) {
  flush_reads();
  ev("X %s %llu\n", reason, (unsigned long long)now_us);
  _Exit(0);
}

static void tick(uint64_t us) {
  now_us += us;
  if (!test_mode && now_us >= limit_us) { now_us = limit_us; stop("time"); }
}

static void flush_reads() {
  for (int p = 0; p < NPINS; p++) if (pin_reads[p]) ev("R %d %lu\n", p, pin_reads[p]);
}

static bool valid_pin(uint8_t pin) {
  if (pin < NPINS) return true;
  if (!warned_badpin) { warned_badpin = true; ev("w badpin %d\n", pin); }
  return false;
}

// ── Output ──────────────────────────────────────────────────
static void out(const char *s, size_t n) {
  if (!n) return;
  if (capturing && capture_buf) {
    char tmp[2] = {0, 0};
    for (size_t i = 0; i < n; i++) { tmp[0] = s[i]; capture_buf->concat(tmp); }
    return;
  }
  if (!serial_begun && !warned_begin && !test_mode) { warned_begin = true; ev("w nobegin 0\n"); }
  out_bytes += n;
  if (out_bytes > MAX_OUT) {
    ::write(1, s, n);
    stop("output");
  }
  ::write(1, s, n);
}

// ── Digital / analog I/O ────────────────────────────────────
void pinMode(uint8_t pin, uint8_t mode) {
  if (!valid_pin(pin)) return;
  pin_mode[pin] = mode;
  ev("M %d %d %llu\n", pin, mode, (unsigned long long)now_us);
  count_event();
  tick(2);
}

void digitalWrite(uint8_t pin, uint8_t val) {
  if (!valid_pin(pin)) return;
  int v = val ? 1 : 0;
  if (pin_mode[pin] != OUTPUT && !warned_output[pin]) { warned_output[pin] = true; ev("w nooutput %d\n", pin); }
  if (v && !pin_out[pin]) pin_rises[pin]++;
  if (pin_out[pin] != v || pin_mode[pin] != OUTPUT) {
    ev("D %d %d %llu\n", pin, v, (unsigned long long)now_us);
    count_event();
  }
  pin_out[pin] = v;
  tick(4);
}

static int sched_value(Sched *s, int n, int pin, int dflt) {
  int v = dflt; uint64_t best = 0; bool found = false;
  for (int i = 0; i < n; i++)
    if (s[i].pin == pin && s[i].t <= now_us && (!found || s[i].t >= best)) { v = s[i].val; best = s[i].t; found = true; }
  return v;
}

int digitalRead(uint8_t pin) {
  if (!valid_pin(pin)) return LOW;
  pin_reads[pin]++;
  tick(4);
  if (pin_mode[pin] == OUTPUT) return pin_out[pin];
  int dflt = pin_mode[pin] == INPUT_PULLUP ? HIGH : LOW;
  return sched_value(dsched, nd, pin, dflt) ? HIGH : LOW;
}

int analogRead(uint8_t pin) {
  if (pin < 6) pin += 14;
  if (!valid_pin(pin)) return 0;
  pin_reads[pin]++;
  tick(112);
  int v = sched_value(asched, na, pin, 0);
  return v < 0 ? 0 : v > 1023 ? 1023 : v;
}

static bool is_pwm(uint8_t pin) {
  return pin == 3 || pin == 5 || pin == 6 || pin == 9 || pin == 10 || pin == 11;
}

void analogWrite(uint8_t pin, int val) {
  if (!valid_pin(pin)) return;
  if (val < 0) val = 0;
  if (val > 255) val = 255;
  if (pin_mode[pin] != OUTPUT && !warned_output[pin]) { warned_output[pin] = true; ev("w nooutput %d\n", pin); }
  if (!is_pwm(pin)) {
    if (!warned_pwm[pin]) { warned_pwm[pin] = true; ev("w nopwm %d\n", pin); }
    digitalWrite(pin, val < 128 ? LOW : HIGH);
    return;
  }
  ev("A %d %d %llu\n", pin, val, (unsigned long long)now_us);
  count_event();
  tick(4);
}

void tone(uint8_t pin, unsigned int frequency, unsigned long duration) {
  if (!valid_pin(pin)) return;
  pin_tone[pin] = frequency;
  ev("T %d %u %llu\n", pin, frequency, (unsigned long long)now_us);
  if (duration) ev("T %d 0 %llu\n", pin, (unsigned long long)(now_us + duration * 1000ULL));
  count_event();
  tick(4);
}

void noTone(uint8_t pin) {
  if (!valid_pin(pin)) return;
  pin_tone[pin] = 0;
  ev("T %d 0 %llu\n", pin, (unsigned long long)now_us);
  count_event();
  tick(4);
}

// ── Time ────────────────────────────────────────────────────
unsigned long millis(void) { tick(2); return (unsigned long)(now_us / 1000ULL); }
unsigned long micros(void) { tick(2); return (unsigned long)now_us; }
void delay(unsigned long ms) { tick((uint64_t)ms * 1000ULL); }
void delayMicroseconds(unsigned int us) { tick(us); }

// ── Math helpers ────────────────────────────────────────────
static unsigned long rng = 1;
static long next_rand() {
  rng = rng * 1103515245UL + 12345UL;
  return (long)((rng >> 1) & 0x7fffffffUL);
}
long random(long howbig) { return howbig <= 0 ? 0 : next_rand() % howbig; }
long random(long howsmall, long howbig) {
  if (howsmall >= howbig) return howsmall;
  return random(howbig - howsmall) + howsmall;
}
void randomSeed(unsigned long seed) { if (seed) rng = seed; }
long map(long x, long in_min, long in_max, long out_min, long out_max) {
  if (in_max == in_min) return out_min;
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// ── String ──────────────────────────────────────────────────
void String::init() { buf = 0; cap = 0; len = 0; }
bool String::grow(unsigned int size) {
  if (buf && cap >= size) return true;
  unsigned int ncap = size < 16 ? 16 : size;
  char *nb = (char *)realloc(buf, ncap + 1);
  if (!nb) return false;
  if (!buf) nb[0] = 0;
  buf = nb; cap = ncap;
  return true;
}
bool String::append(const char *s, unsigned int n) {
  if (!grow(len + n)) return false;
  memmove(buf + len, s, n);
  len += n; buf[len] = 0;
  return true;
}
void String::assign(const char *s, unsigned int n) {
  if (!grow(n)) return;
  memmove(buf, s, n);
  len = n; buf[len] = 0;
}
bool String::reserve(unsigned int size) { return grow(size); }

static void fmt_int(char *b, size_t sz, long v, unsigned char base, bool is_signed) {
  if (base == 10 && is_signed) { snprintf(b, sz, "%ld", v); return; }
  unsigned long u = (unsigned long)v;
  char tmp[40]; int i = 0;
  if (base < 2) base = 10;
  do { int d = u % base; tmp[i++] = d < 10 ? '0' + d : 'a' + d - 10; u /= base; } while (u && i < 39);
  int j = 0; while (i) b[j++] = tmp[--i]; b[j] = 0;
}

String::String(const char *cstr) { init(); if (cstr) assign(cstr, strlen(cstr)); else assign("", 0); }
String::String(const String &s) { init(); assign(s.c_str(), s.len); }
String::String(char c) { init(); char b[2] = {c, 0}; assign(b, c ? 1 : 0); }
String::String(unsigned char v, unsigned char base) { init(); char b[40]; fmt_int(b, sizeof b, v, base, false); assign(b, strlen(b)); }
String::String(int v, unsigned char base) { init(); char b[40]; fmt_int(b, sizeof b, v, base, true); assign(b, strlen(b)); }
String::String(unsigned int v, unsigned char base) { init(); char b[40]; fmt_int(b, sizeof b, (long)v, base, false); assign(b, strlen(b)); }
String::String(long v, unsigned char base) { init(); char b[40]; fmt_int(b, sizeof b, v, base, true); assign(b, strlen(b)); }
String::String(unsigned long v, unsigned char base) { init(); char b[40]; fmt_int(b, sizeof b, (long)v, base, false); assign(b, strlen(b)); }
String::String(float v, unsigned char d) { init(); char b[64]; snprintf(b, sizeof b, "%.*f", d, (double)v); assign(b, strlen(b)); }
String::String(double v, unsigned char d) { init(); char b[64]; snprintf(b, sizeof b, "%.*f", d, v); assign(b, strlen(b)); }
String::~String() { free(buf); }

String &String::operator=(const String &rhs) { if (this != &rhs) assign(rhs.c_str(), rhs.len); return *this; }
String &String::operator=(const char *cstr) { if (cstr) assign(cstr, strlen(cstr)); else assign("", 0); return *this; }

bool String::concat(const String &s) { String copy(s); return append(copy.c_str(), copy.len); }
bool String::concat(const char *cstr) { return cstr ? append(cstr, strlen(cstr)) : false; }
bool String::concat(char c) { return append(&c, 1); }
bool String::concat(unsigned char n) { return concat(String(n)); }
bool String::concat(int n) { return concat(String(n)); }
bool String::concat(unsigned int n) { return concat(String(n)); }
bool String::concat(long n) { return concat(String(n)); }
bool String::concat(unsigned long n) { return concat(String(n)); }
bool String::concat(float n) { return concat(String(n)); }
bool String::concat(double n) { return concat(String(n)); }

int String::compareTo(const String &s) const { return strcmp(c_str(), s.c_str()); }
bool String::equals(const String &s) const { return len == s.len && strcmp(c_str(), s.c_str()) == 0; }
bool String::equals(const char *cstr) const { return strcmp(c_str(), cstr ? cstr : "") == 0; }
bool String::equalsIgnoreCase(const String &s) const {
  if (len != s.len) return false;
  for (unsigned i = 0; i < len; i++) if (tolower((unsigned char)buf[i]) != tolower((unsigned char)s.buf[i])) return false;
  return true;
}
bool String::startsWith(const String &p) const { return p.len <= len && strncmp(c_str(), p.c_str(), p.len) == 0; }
bool String::startsWith(const String &p, unsigned int off) const { return off + p.len <= len && strncmp(c_str() + off, p.c_str(), p.len) == 0; }
bool String::endsWith(const String &s) const { return s.len <= len && strcmp(c_str() + len - s.len, s.c_str()) == 0; }

char String::charAt(unsigned int i) const { return i < len ? buf[i] : 0; }
void String::setCharAt(unsigned int i, char c) { if (i < len) buf[i] = c; }
char String::operator[](unsigned int i) const { return charAt(i); }
char &String::operator[](unsigned int i) { static char dummy; if (i >= len || !buf) { dummy = 0; return dummy; } return buf[i]; }

int String::indexOf(char ch) const { return indexOf(ch, 0); }
int String::indexOf(char ch, unsigned int from) const {
  if (from >= len) return -1;
  const char *p = strchr(buf + from, ch);
  return p ? (int)(p - buf) : -1;
}
int String::indexOf(const String &s) const { return indexOf(s, 0); }
int String::indexOf(const String &s, unsigned int from) const {
  if (from > len) return -1;
  const char *p = strstr(c_str() + from, s.c_str());
  return p ? (int)(p - c_str()) : -1;
}
int String::lastIndexOf(char ch) const { const char *p = strrchr(c_str(), ch); return p ? (int)(p - c_str()) : -1; }
int String::lastIndexOf(const String &s) const {
  if (s.len > len) return -1;
  for (int i = (int)(len - s.len); i >= 0; i--) if (strncmp(c_str() + i, s.c_str(), s.len) == 0) return i;
  return -1;
}
String String::substring(unsigned int b, unsigned int e) const {
  if (b > e) { unsigned int t = b; b = e; e = t; }
  String r;
  if (b >= len) return r;
  if (e > len) e = len;
  r.assign(c_str() + b, e - b);
  return r;
}
void String::replace(char f, char r) { for (unsigned i = 0; i < len; i++) if (buf[i] == f) buf[i] = r; }
void String::replace(const String &f, const String &r) {
  if (!f.len) return;
  String out; unsigned i = 0;
  while (i < len) {
    if (strncmp(buf + i, f.c_str(), f.len) == 0) { out.concat(r); i += f.len; }
    else { out.append(buf + i, 1); i++; }
  }
  *this = out;
}
void String::remove(unsigned int index) { if (index < len) { len = index; buf[len] = 0; } }
void String::remove(unsigned int index, unsigned int count) {
  if (index >= len) return;
  if (count > len - index) count = len - index;
  memmove(buf + index, buf + index + count, len - index - count + 1);
  len -= count;
}
void String::toLowerCase() { for (unsigned i = 0; i < len; i++) buf[i] = tolower((unsigned char)buf[i]); }
void String::toUpperCase() { for (unsigned i = 0; i < len; i++) buf[i] = toupper((unsigned char)buf[i]); }
void String::trim() {
  if (!len) return;
  unsigned b = 0, e = len;
  while (b < len && isspace((unsigned char)buf[b])) b++;
  while (e > b && isspace((unsigned char)buf[e - 1])) e--;
  memmove(buf, buf + b, e - b);
  len = e - b; buf[len] = 0;
}
long String::toInt() const { return atol(c_str()); }
float String::toFloat() const { return (float)atof(c_str()); }
double String::toDouble() const { return atof(c_str()); }

String operator+(const String &l, const String &r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, const char *r) { String s(l); s.concat(r); return s; }
String operator+(const char *l, const String &r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, char r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, unsigned char r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, int r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, unsigned int r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, long r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, unsigned long r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, float r) { String s(l); s.concat(r); return s; }
String operator+(const String &l, double r) { String s(l); s.concat(r); return s; }

// ── Serial ──────────────────────────────────────────────────
void HardwareSerial::begin(unsigned long baud) {
  serial_begun = true;
  ev("B %lu %llu\n", baud, (unsigned long long)now_us);
  tick(10);
}
void HardwareSerial::end() { serial_begun = false; }

int HardwareSerial::available() {
  tick(2);
  int n = 0;
  for (int i = 0; i < nser; i++) if (serin[i].t <= now_us) n += (int)strlen(serin[i].text + serin[i].pos);
  return n;
}
static SerIn *next_input() {
  for (int i = 0; i < nser; i++) if (serin[i].t <= now_us && serin[i].text[serin[i].pos]) return &serin[i];
  return 0;
}
int HardwareSerial::read() {
  tick(2);
  SerIn *s = next_input();
  if (!s) return -1;
  return (unsigned char)s->text[s->pos++];
}
int HardwareSerial::peek() {
  SerIn *s = next_input();
  return s ? (unsigned char)s->text[s->pos] : -1;
}
void HardwareSerial::setTimeout(unsigned long ms) { timeout = ms; }

// Waits (in simulated time) up to the timeout for the next character.
int HardwareSerial::timedPeek() {
  uint64_t start = now_us;
  for (;;) {
    int c = peek();
    if (c >= 0) return c;
    uint64_t deadline = start + (uint64_t)timeout * 1000ULL, next = deadline;
    for (int i = 0; i < nser; i++) if (serin[i].t > now_us && serin[i].t < next && serin[i].text[serin[i].pos]) next = serin[i].t;
    if (now_us >= deadline) return -1;
    tick(next - now_us);
  }
}
long HardwareSerial::parseInt() {
  int c;
  while ((c = timedPeek()) >= 0 && !(c == '-' || isdigit(c))) read();
  if (c < 0) return 0;
  bool neg = false; long v = 0;
  if (c == '-') { neg = true; read(); }
  while ((c = timedPeek()) >= 0 && isdigit(c)) { v = v * 10 + (c - '0'); read(); }
  return neg ? -v : v;
}
float HardwareSerial::parseFloat() {
  int c;
  while ((c = timedPeek()) >= 0 && !(c == '-' || c == '.' || isdigit(c))) read();
  if (c < 0) return 0;
  char b[40]; int n = 0;
  while ((c = timedPeek()) >= 0 && (c == '-' || c == '.' || isdigit(c)) && n < 39) { b[n++] = (char)c; read(); }
  b[n] = 0;
  return (float)atof(b);
}
String HardwareSerial::readString() {
  String s;
  int c;
  while ((c = timedPeek()) >= 0) { s.concat((char)c); read(); }
  return s;
}
String HardwareSerial::readStringUntil(char t) {
  String s;
  int c;
  while ((c = timedPeek()) >= 0) { read(); if (c == t) break; s.concat((char)c); }
  return s;
}

size_t HardwareSerial::write(uint8_t b) { char c = (char)b; out(&c, 1); tick(10); return 1; }
size_t HardwareSerial::write(const char *s) { size_t n = s ? strlen(s) : 0; out(s, n); tick(10); return n; }
size_t HardwareSerial::write(const uint8_t *b, size_t n) { out((const char *)b, n); tick(10); return n; }

size_t HardwareSerial::printNumber(unsigned long n, uint8_t base) {
  char b[8 * sizeof(long) + 1];
  char *s = &b[sizeof(b) - 1];
  *s = 0;
  if (base < 2) base = 10;
  do { char c = n % base; n /= base; *--s = c < 10 ? c + '0' : c + 'A' - 10; } while (n);
  return write(s);
}
size_t HardwareSerial::printFloat(double number, uint8_t digits) {
  if (isnan(number)) return print("nan");
  if (isinf(number)) return print("inf");
  if (number > 4294967040.0 || number < -4294967040.0) return print("ovf");
  size_t n = 0;
  if (number < 0.0) { n += print('-'); number = -number; }
  double rounding = 0.5;
  for (uint8_t i = 0; i < digits; ++i) rounding /= 10.0;
  number += rounding;
  unsigned long int_part = (unsigned long)number;
  double remainder = number - (double)int_part;
  n += printNumber(int_part, 10);
  if (digits > 0) n += print('.');
  while (digits-- > 0) {
    remainder *= 10.0;
    unsigned int d = (unsigned int)remainder;
    n += printNumber(d, 10);
    remainder -= d;
  }
  return n;
}

size_t HardwareSerial::print(const char *s) { return write(s); }
size_t HardwareSerial::print(const String &s) { return write((const uint8_t *)s.c_str(), s.length()); }
size_t HardwareSerial::print(char c) { return write((uint8_t)c); }
size_t HardwareSerial::print(unsigned char n, int base) { return print((unsigned long)n, base); }
size_t HardwareSerial::print(int n, int base) { return print((long)n, base); }
size_t HardwareSerial::print(unsigned int n, int base) { return print((unsigned long)n, base); }
size_t HardwareSerial::print(long n, int base) {
  if (base == 0) return write((uint8_t)n);
  if (base == 10 && n < 0) { size_t t = print('-'); return t + printNumber((unsigned long)(-n), 10); }
  return printNumber((unsigned long)n, base);
}
size_t HardwareSerial::print(unsigned long n, int base) {
  if (base == 0) return write((uint8_t)n);
  return printNumber(n, base);
}
size_t HardwareSerial::print(double n, int digits) { return printFloat(n, digits); }

size_t HardwareSerial::println() { return write("\r\n"); }
size_t HardwareSerial::println(const char *s) { size_t n = print(s); return n + println(); }
size_t HardwareSerial::println(const String &s) { size_t n = print(s); return n + println(); }
size_t HardwareSerial::println(char c) { size_t n = print(c); return n + println(); }
size_t HardwareSerial::println(unsigned char v, int base) { size_t n = print(v, base); return n + println(); }
size_t HardwareSerial::println(int v, int base) { size_t n = print(v, base); return n + println(); }
size_t HardwareSerial::println(unsigned int v, int base) { size_t n = print(v, base); return n + println(); }
size_t HardwareSerial::println(long v, int base) { size_t n = print(v, base); return n + println(); }
size_t HardwareSerial::println(unsigned long v, int base) { size_t n = print(v, base); return n + println(); }
size_t HardwareSerial::println(double v, int digits) { size_t n = print(v, digits); return n + println(); }

// ── Servo ───────────────────────────────────────────────────
uint8_t Servo::attach(int pin) { return attach(pin, 544, 2400); }
uint8_t Servo::attach(int pin, int minUs, int maxUs) {
  if (pin < 0 || pin >= NPINS) { valid_pin((uint8_t)pin); return 0; }
  pin_ = pin; min_ = minUs; max_ = maxUs;
  pin_mode[pin] = OUTPUT;
  return 1;
}
void Servo::detach() { pin_ = -1; }
bool Servo::attached() { return pin_ >= 0; }
void Servo::write(int value) {
  if (value < 200) {
    if (value < 0) value = 0;
    if (value > 180) value = 180;
    value = (int)map(value, 0, 180, min_, max_);
  }
  writeMicroseconds(value);
}
void Servo::writeMicroseconds(int us) {
  if (us < min_) us = min_;
  if (us > max_) us = max_;
  us_ = us;
  if (pin_ < 0) { ev("w nattach 0\n"); return; }
  ev("V %d %d %llu\n", pin_, read(), (unsigned long long)now_us);
  count_event();
  tick(4);
}
int Servo::read() { return (int)map(us_ + 1, min_, max_, 0, 180); }
int Servo::readMicroseconds() { return us_; }

// ── Checker hooks ───────────────────────────────────────────
void academy_capture_begin() {
  if (!capture_buf) capture_buf = new String();
  *capture_buf = "";
  capturing = true;
}
String academy_capture_end() {
  capturing = false;
  String s = capture_buf ? *capture_buf : String();
  s.replace("\r", "");
  s.trim();
  return s;
}
void academy_report(const char *id, bool ok, const String &got) {
  if (ok) { ev("PASS %s\n", id); return; }
  String g(got);
  g.replace("\n", " | ");
  ::write(2, "FAIL ", 5); ::write(2, id, strlen(id));
  ::write(2, " :: got ", 8); ::write(2, g.c_str(), g.length()); ::write(2, "\n", 1);
}
String academy_fmt(bool v) { return String(v ? "true" : "false"); }
String academy_fmt(char v) { return String("'") + v + "'"; }
String academy_fmt(int v) { return String(v); }
String academy_fmt(unsigned int v) { return String(v); }
String academy_fmt(long v) { return String(v); }
String academy_fmt(unsigned long v) { return String(v); }
String academy_fmt(float v) { char b[48]; snprintf(b, sizeof b, "%g", (double)v); return String(b); }
String academy_fmt(double v) { char b[48]; snprintf(b, sizeof b, "%g", v); return String(b); }
String academy_fmt(const char *v) { return String("\"") + (v ? v : "") + "\""; }
String academy_fmt(const String &v) { return String("\"") + v + "\""; }
bool academy_near(double a, double b) { return fabs(a - b) < 1e-3; }
int academy_rises(uint8_t pin) { return pin < NPINS ? pin_rises[pin] : 0; }
int academy_pin_out(uint8_t pin) { return pin < NPINS ? pin_out[pin] : 0; }
void academy_reset_pins() { for (int p = 0; p < NPINS; p++) { pin_rises[p] = 0; pin_out[p] = 0; } }

// ── Config + entry point ────────────────────────────────────
// argv[1] holds the scenario, e.g. "limit=8000;D:2:1000:0;A:14:0:512;S:500:hello%0A"
static void url_decode(char *s) {
  char *o = s;
  for (; *s; s++) {
    if (*s == '%' && isxdigit((unsigned char)s[1]) && isxdigit((unsigned char)s[2])) {
      char h[3] = {s[1], s[2], 0}; *o++ = (char)strtol(h, 0, 16); s += 2;
    } else *o++ = *s;
  }
  *o = 0;
}
static void parse_config(char *cfg) {
  for (char *tok = strtok(cfg, ";"); tok; tok = strtok(0, ";")) {
    if (!strncmp(tok, "limit=", 6)) limit_us = (uint64_t)atol(tok + 6) * 1000ULL;
    else if (!strncmp(tok, "seed=", 5)) rng = (unsigned long)atol(tok + 5);
    else if (!strcmp(tok, "test")) test_mode = true;
    else if ((tok[0] == 'D' || tok[0] == 'A') && tok[1] == ':') {
      int pin = 0; long t = 0; int v = 0;
      if (sscanf(tok + 2, "%d:%ld:%d", &pin, &t, &v) == 3) {
        if (tok[0] == 'A' && pin < 6) pin += 14;
        Sched s = {pin, (uint64_t)t * 1000ULL, v};
        if (tok[0] == 'D' && nd < 64) dsched[nd++] = s;
        if (tok[0] == 'A' && na < 64) asched[na++] = s;
      }
    } else if (tok[0] == 'S' && tok[1] == ':' && nser < 16) {
      char *colon = strchr(tok + 2, ':');
      if (!colon) continue;
      *colon = 0;
      char *text = strdup(colon + 1);
      url_decode(text);
      serin[nser].t = (uint64_t)atol(tok + 2) * 1000ULL;
      serin[nser].text = text;
      serin[nser].pos = 0;
      nser++;
    }
  }
}

extern "C" void academy_test_main() __attribute__((weak));

int main(int argc, char **argv) {
  for (int p = 0; p < NPINS; p++) { pin_mode[p] = -1; pin_out[p] = 0; pin_tone[p] = 0; pin_reads[p] = 0; }
  if (argc > 1) { char *cfg = strdup(argv[1]); parse_config(cfg); }
  if (academy_test_main) {
    test_mode = true;
    academy_test_main();
    return 0;
  }
  setup();
  for (;;) {
    loop();
    loops++;
    tick(4);
  }
}
