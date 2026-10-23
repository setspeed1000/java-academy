// Simulated Arduino Uno core for Arduino Academy.
// Mirrors the parts of the real Arduino API that beginners use. Time is virtual:
// delay() advances a simulated clock instantly, so a 10-second sketch runs in milliseconds.
#ifndef ACADEMY_ARDUINO_H
#define ACADEMY_ARDUINO_H

#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <stdio.h>

typedef uint8_t byte;
typedef bool boolean;
typedef uint16_t word;

#define HIGH 0x1
#define LOW  0x0
#define INPUT 0x0
#define OUTPUT 0x1
#define INPUT_PULLUP 0x2
#define LED_BUILTIN 13

#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A4 18
#define A5 19

#define DEC 10
#define HEX 16
#define OCT 8
#define BIN 2

#define PI 3.1415926535897932384626433832795
#define HALF_PI 1.5707963267948966192313216916398
#define TWO_PI 6.283185307179586476925286766559
#define DEG_TO_RAD 0.017453292519943295769236907684886
#define RAD_TO_DEG 57.295779513082320876798154814105
#define EULER 2.718281828459045235360287471352

#define F(s) (s)
#define PROGMEM

#ifdef abs
#undef abs
#endif
#define min(a,b) ((a)<(b)?(a):(b))
#define max(a,b) ((a)>(b)?(a):(b))
#define abs(x) ((x)>0?(x):-(x))
#define constrain(amt,low,high) ((amt)<(low)?(low):((amt)>(high)?(high):(amt)))
#define radians(deg) ((deg)*DEG_TO_RAD)
#define degrees(rad) ((rad)*RAD_TO_DEG)
#define sq(x) ((x)*(x))

#define lowByte(w) ((uint8_t) ((w) & 0xff))
#define highByte(w) ((uint8_t) ((w) >> 8))
#define bitRead(value, bit) (((value) >> (bit)) & 0x01)
#define bitSet(value, bit) ((value) |= (1UL << (bit)))
#define bitClear(value, bit) ((value) &= ~(1UL << (bit)))
#define bitWrite(value, bit, bitvalue) ((bitvalue) ? bitSet(value, bit) : bitClear(value, bit))
#define bit(b) (1UL << (b))

void pinMode(uint8_t pin, uint8_t mode);
void digitalWrite(uint8_t pin, uint8_t val);
int digitalRead(uint8_t pin);
int analogRead(uint8_t pin);
void analogWrite(uint8_t pin, int val);

unsigned long millis(void);
unsigned long micros(void);
void delay(unsigned long ms);
void delayMicroseconds(unsigned int us);

void tone(uint8_t pin, unsigned int frequency, unsigned long duration = 0);
void noTone(uint8_t pin);

long random(long howbig);
long random(long howsmall, long howbig);
void randomSeed(unsigned long seed);
long map(long x, long in_min, long in_max, long out_min, long out_max);

class String {
public:
  String(const char *cstr = "");
  String(const String &str);
  explicit String(char c);
  explicit String(unsigned char value, unsigned char base = 10);
  explicit String(int value, unsigned char base = 10);
  explicit String(unsigned int value, unsigned char base = 10);
  explicit String(long value, unsigned char base = 10);
  explicit String(unsigned long value, unsigned char base = 10);
  explicit String(float value, unsigned char decimalPlaces = 2);
  explicit String(double value, unsigned char decimalPlaces = 2);
  ~String();

  String &operator=(const String &rhs);
  String &operator=(const char *cstr);

  bool reserve(unsigned int size);
  unsigned int length() const { return len; }
  const char *c_str() const { return buf ? buf : ""; }

  bool concat(const String &str);
  bool concat(const char *cstr);
  bool concat(char c);
  bool concat(unsigned char num);
  bool concat(int num);
  bool concat(unsigned int num);
  bool concat(long num);
  bool concat(unsigned long num);
  bool concat(float num);
  bool concat(double num);

  String &operator+=(const String &rhs) { concat(rhs); return *this; }
  String &operator+=(const char *cstr) { concat(cstr); return *this; }
  String &operator+=(char c) { concat(c); return *this; }
  String &operator+=(unsigned char num) { concat(num); return *this; }
  String &operator+=(int num) { concat(num); return *this; }
  String &operator+=(unsigned int num) { concat(num); return *this; }
  String &operator+=(long num) { concat(num); return *this; }
  String &operator+=(unsigned long num) { concat(num); return *this; }
  String &operator+=(float num) { concat(num); return *this; }
  String &operator+=(double num) { concat(num); return *this; }

  int compareTo(const String &s) const;
  bool equals(const String &s) const;
  bool equals(const char *cstr) const;
  bool equalsIgnoreCase(const String &s) const;
  bool operator==(const String &rhs) const { return equals(rhs); }
  bool operator==(const char *cstr) const { return equals(cstr); }
  bool operator!=(const String &rhs) const { return !equals(rhs); }
  bool operator!=(const char *cstr) const { return !equals(cstr); }
  bool operator<(const String &rhs) const { return compareTo(rhs) < 0; }
  bool operator>(const String &rhs) const { return compareTo(rhs) > 0; }
  bool operator<=(const String &rhs) const { return compareTo(rhs) <= 0; }
  bool operator>=(const String &rhs) const { return compareTo(rhs) >= 0; }
  bool startsWith(const String &prefix) const;
  bool startsWith(const String &prefix, unsigned int offset) const;
  bool endsWith(const String &suffix) const;

  char charAt(unsigned int index) const;
  void setCharAt(unsigned int index, char c);
  char operator[](unsigned int index) const;
  char &operator[](unsigned int index);

  int indexOf(char ch) const;
  int indexOf(char ch, unsigned int fromIndex) const;
  int indexOf(const String &str) const;
  int indexOf(const String &str, unsigned int fromIndex) const;
  int lastIndexOf(char ch) const;
  int lastIndexOf(const String &str) const;
  String substring(unsigned int beginIndex) const { return substring(beginIndex, len); }
  String substring(unsigned int beginIndex, unsigned int endIndex) const;

  void replace(char find, char replace);
  void replace(const String &find, const String &replace);
  void remove(unsigned int index);
  void remove(unsigned int index, unsigned int count);
  void toLowerCase();
  void toUpperCase();
  void trim();

  long toInt() const;
  float toFloat() const;
  double toDouble() const;

private:
  char *buf;
  unsigned int cap;
  unsigned int len;
  void init();
  bool grow(unsigned int size);
  bool append(const char *s, unsigned int n);
  void assign(const char *s, unsigned int n);
};

String operator+(const String &lhs, const String &rhs);
String operator+(const String &lhs, const char *rhs);
String operator+(const char *lhs, const String &rhs);
String operator+(const String &lhs, char rhs);
String operator+(const String &lhs, unsigned char rhs);
String operator+(const String &lhs, int rhs);
String operator+(const String &lhs, unsigned int rhs);
String operator+(const String &lhs, long rhs);
String operator+(const String &lhs, unsigned long rhs);
String operator+(const String &lhs, float rhs);
String operator+(const String &lhs, double rhs);

class HardwareSerial {
public:
  void begin(unsigned long baud);
  void begin(unsigned long baud, int config) { begin(baud); (void)config; }
  void end();
  operator bool() const { return true; }

  int available();
  int read();
  int peek();
  void flush() {}
  void setTimeout(unsigned long ms);
  long parseInt();
  float parseFloat();
  String readString();
  String readStringUntil(char terminator);

  size_t write(uint8_t b);
  size_t write(const char *s);
  size_t write(const uint8_t *buffer, size_t size);

  size_t print(const char *s);
  size_t print(const String &s);
  size_t print(char c);
  size_t print(unsigned char n, int base = DEC);
  size_t print(int n, int base = DEC);
  size_t print(unsigned int n, int base = DEC);
  size_t print(long n, int base = DEC);
  size_t print(unsigned long n, int base = DEC);
  size_t print(double n, int digits = 2);

  size_t println();
  size_t println(const char *s);
  size_t println(const String &s);
  size_t println(char c);
  size_t println(unsigned char n, int base = DEC);
  size_t println(int n, int base = DEC);
  size_t println(unsigned int n, int base = DEC);
  size_t println(long n, int base = DEC);
  size_t println(unsigned long n, int base = DEC);
  size_t println(double n, int digits = 2);

private:
  size_t printNumber(unsigned long n, uint8_t base);
  size_t printFloat(double number, uint8_t digits);
  int timedPeek();
  unsigned long timeout = 1000;
};

extern HardwareSerial Serial;

void setup(void);
void loop(void);

// ── Hooks used by the hidden checker (not part of the real Arduino API) ──
void academy_capture_begin();
String academy_capture_end();
void academy_report(const char *id, bool ok, const String &got);
String academy_fmt(bool v);
String academy_fmt(char v);
String academy_fmt(int v);
String academy_fmt(unsigned int v);
String academy_fmt(long v);
String academy_fmt(unsigned long v);
String academy_fmt(float v);
String academy_fmt(double v);
String academy_fmt(const char *v);
String academy_fmt(const String &v);
bool academy_near(double a, double b);
int academy_rises(uint8_t pin);
int academy_pin_out(uint8_t pin);
void academy_reset_pins();

#endif
