#! /bin/bash
melt `for file in videos/*.webm; do echo $file; done` -consumer avformat:output.webm