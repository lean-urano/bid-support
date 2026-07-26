#!/bin/bash
cd /var/www/tender-support/collector
while true; do
  npm run crawl:gifu
  sleep 3600
done
