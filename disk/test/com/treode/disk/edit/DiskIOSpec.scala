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

  //this isn't testing what it should :[
  // i'm not able to get write to get a >1 element unrolledBuffer 
  // hence I cant test the large batch position recording 
  it should "be able to write a full batch out of order correctly and then read it " in {
    println("------- Test 4 ------")
    implicit val scheduler = StubScheduler.random()
    val f = StubFile (1 << 20, 0)
    val a = "lorem "
    val b = "ipsum "
    val c = "dolor "
    val d = "sit "
    val e = "amet"
    val dsp = new PageDispatcher(0)
    val a_callback = dsp.write(a).capture()
    val b_callback = dsp.write(b).capture()
    val e_callback = dsp.write(e).capture()
    val c_callback = dsp.write(c).capture()
    val d_callback = dsp.write(d).capture()
    val dw = new PageWriter (dsp, f)
    val (posA, lenA) = a_callback.expectPass()
    val (posB, lenB) = b_callback.expectPass()
    val (posE, lenE) = e_callback.expectPass()
    val (posC, lenC) = c_callback.expectPass()
    val (posD, lenD) = d_callback.expectPass()
    val dr = new PageReader (f)
    val readB = dr.readString (posB, lenB) .expectPass()
    val readA = dr.readString (posA, lenA) .expectPass()
    val readE = dr.readString (posE, lenE) .expectPass()
    val readD = dr.readString (posD, lenD) .expectPass()
    val readC = dr.readString (posC, lenC) .expectPass()
    assert (a.equals (readA))
    assert (b.equals (readB))
    assert (c.equals (readC))
    assert (d.equals (readD))
    assert (e.equals (readE))
    assert (posA == 0)
    assert (posB == a.length+1)
    assert (posC == (a.length+1) + (b.length+1) + (e.length+1))
    assert (posD == (a.length+1) + (b.length+1) + (e.length+1) + (c.length+1))
    assert (posE == (a.length+1) + (b.length+1))
  }
  
}
