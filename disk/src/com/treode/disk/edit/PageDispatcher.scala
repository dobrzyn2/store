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
import com.treode.async.{Async, Callback, Scheduler}, Async.supply, Callback.ignore
import com.treode.async.io.File
import com.treode.async.Async
import com.treode.buffer.PagedBuffer
import scala.collection.mutable.UnrolledBuffer
import com.treode.async.implicits._

private class PageWriter(dsp: PageDispatcher,val file: File)
 {
  val bits = 10
  val buffer = PagedBuffer (bits)
  var pos : Long = 0
  val dispatcher = dsp
  
  listen() run (ignore)

  def listen(): Async[Unit] = 
    for { 
      (_, strings) <- dispatcher.receive()    //returns (unrolledBuffer,cb)
      _ <- write(strings)
    } yield {
      listen() run (ignore)
    }
    
  /**
   * Write `data` into the file asynchronously, using a write buffer. Returns
   * the position of the writer and length written, if successful.
   */
  def write (data: UnrolledBuffer [(String, Callback[(Long, Int)])]) : Async [(Long, Int)] = {
    var writePositions : Array[(Long,Int)] = new Array[(Long,Int)](data.length);
    var i = 0
    var beforeWritesPos = buffer.writePos
    for (s <- data) {
      var beforeEachWritePos = buffer.writePos
      buffer.writeString (s._1)
      writePositions(i) = (buffer.writePos, buffer.writePos - beforeEachWritePos)
      i+=1
    }
    for {
      _ <- file.flush (buffer, pos)
    } yield {
      buffer.clear ()
      var q = 0
      for (s <- data){
        s._2.pass(writePositions(q))
        q+=1
      }
      (buffer.writePos, buffer.writePos - beforeWritesPos)
    }
  }
}
