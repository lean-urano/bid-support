#!/bin/bash
cd /var/www/bid-support/collector
while true; do
  npm run crawl:nexco-east
  sleep 3600
done
