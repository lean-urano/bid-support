#!/bin/bash
cd /var/www/tender-support/collector
while true; do
  npm run crawl:nexco-east
  sleep 3600
done
