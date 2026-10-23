// Simulated Servo library (same API as the Arduino Servo library).
#ifndef ACADEMY_SERVO_H
#define ACADEMY_SERVO_H
#include "Arduino.h"

class Servo {
public:
  uint8_t attach(int pin);
  uint8_t attach(int pin, int minUs, int maxUs);
  void detach();
  void write(int value);
  void writeMicroseconds(int us);
  int read();
  int readMicroseconds();
  bool attached();
private:
  int pin_ = -1;
  int us_ = 1500;
  int min_ = 544;
  int max_ = 2400;
};

#endif
