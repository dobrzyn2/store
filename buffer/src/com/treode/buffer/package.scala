package com.treode

package buffer {

  trait Buffer extends InputBuffer with OutputBuffer

  class BufferOverflowException (required: Int, available: Int) extends Exception {
    override def getMessage = s"Buffer overflow, $required required, $available available."
  }

  class BufferUnderflowException (required: Int, available: Int) extends Exception {
    override def getMessage = s"Buffer underflow, $required required, $available available."
  }}

package object buffer {

  private [buffer] def isAscii (v: String): Boolean = {
    var i = 0
    while (i < v.length) {
      if (v.charAt(i) > 127)
        return false
      i += 1
    }
    return true
  }

  private [buffer] def twopow (n: Int): Int = {
    var x = n
    x |= x >> 1
    x |= x >> 2
    x |= x >> 4
    x |= x >> 8
    x |= x >> 16
    x + 1
  }}