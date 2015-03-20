/*
 * Copyright 2014 Treode, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.treode.disk.edit

import com.treode.async.io.stubs.StubFile
import com.treode.async.stubs.StubScheduler
import com.treode.async.stubs.implicits._
import com.treode.disk.DiskTestConfig
import org.scalatest.FlatSpec

class DiskIOSpec extends FlatSpec {

  implicit val config = DiskTestConfig()

  "The PageReader" should "be able to read the string the PageWriter wrote" in {
    implicit val scheduler = StubScheduler.random()
    println("--------- Test 1 ---------")
    val a = "this is a string"
    val readPos = 0
    val f = StubFile (1 << 20, 0)
    val dsp = new PageDispatcher(0)
    val dw = new PageWriter (dsp, f)
    val dr = new PageReader (f)
    val(posA, lenA) = dsp.write(a) .expectPass()
    val readString = dr.readString (readPos, lenA) .expectPass()
    assert (a.equals (readString))
  }



  "The DiskIO Reader/Writer " should " be able to write and read multiple times to disk" in {
    println("--------- Test 2 ---------")
    implicit val scheduler = StubScheduler.random()
    val a = "abcdef"
    val b = "123456789"
    val startPos = 0
    val f = StubFile (1 << 20, 0)
    val dsp = new PageDispatcher(0)
    val dw = new PageWriter (dsp,f)
    val dr = new PageReader (f)
    val (posA, lenA) = dsp.write(a) .expectPass()
    val (posB, lenB) = dsp.write(b) .expectPass()
    val readA = dr.readString (posA, lenA) .expectPass()
    val readB = dr.readString (posB, lenB) .expectPass()
    println("posA, lenA: " + posA + " " + lenA + " posB,lenB: " + posB + " " + lenB)
    println("a is " + a + " readA is " + readA)
    println("b is " + b + " readB is " + readB)
    assert (a.equals (readA))
    assert (b.equals (readB))
    assert (posA == 0 )
    assert (posB == a.length + 1)
  }

  it should "write and read correctly out of order" in {
    println("------- Test 3 ------")
    implicit val scheduler = StubScheduler.random()
    val a = "abcdef"
    val b = "123456789"
    val f = StubFile (1 << 20, 0)
    val dsp = new PageDispatcher(0)
    val dw = new PageWriter (dsp, f)
    val dr = new PageReader (f)
    val (posA, lenA) = dsp.write(a) .expectPass()
    val (posB, lenB) = dsp.write(b) .expectPass()
    val readB = dr.readString (posB, lenB) .expectPass()
    val readA = dr.readString (posA, lenA) .expectPass()
    assert (a.equals (readA))
    assert (b.equals (readB))
    assert (posA == 0)
    assert (posB == a.length + 1)
  }

  it should "be able to write a full batch correctly and then read it " in {
    println("------- Test 4 ------")
    implicit val scheduler = StubScheduler.random()
    val a = "lorem "
    val b = "ipsum "
    val c = "dolor "
    val d = "sit "
    val e = "amet"
    val f = StubFile (1 << 20, 0)
    val dsp = new PageDispatcher(0)
    //makes it pass
    val dw = new PageWriter (dsp, f)
    val (posA, lenA) = dsp.write(a).expectPass()
    val (posB, lenB) = dsp.write(b).expectPass()
    val (posC, lenC) = dsp.write(c).expectPass()
    val (posD, lenD) = dsp.write(d).expectPass()
    val (posE, lenE) = dsp.write(e).expectPass()
    //makes it not pass
    //val dw = new PageWriter (dsp, f)
    val dr = new PageReader (f)
    val readB = dr.readString (posB, lenB) .expectPass()
    val readA = dr.readString (posA, lenA) .expectPass()
    assert (a.equals (readA))
    assert (b.equals (readB))
    assert (posA == 0)
    assert (posB == a.length + 1)


  }
  
}
