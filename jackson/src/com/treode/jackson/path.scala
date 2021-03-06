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

package com.treode.jackson

import java.nio.file.{Path, Paths}
import com.fasterxml.jackson.core.{JsonGenerator, JsonParser, JsonToken}
import com.fasterxml.jackson.databind.{DeserializationContext, SerializerProvider}
import com.fasterxml.jackson.databind.deser.std.StdDeserializer
import com.fasterxml.jackson.databind.ser.std.StdSerializer

object PathSerializer extends StdSerializer [Path] (classOf [Path]) {

  def serialize (value: Path, jgen: JsonGenerator, provider: SerializerProvider) {
    jgen.writeString (value.toString)
  }}

object PathDeserializer extends StdDeserializer [Path] (classOf [Path]) {

  def deserialize (jparser: JsonParser, context: DeserializationContext): Path = {
    if (jparser.getCurrentToken != JsonToken.VALUE_STRING)
      throw context.mappingException ("Malformed path.")
    Paths.get (jparser.getValueAsString)
  }}
