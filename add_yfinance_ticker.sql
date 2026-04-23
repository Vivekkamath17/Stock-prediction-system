-- 1. Add the new column
ALTER TABLE public."Stocks" ADD COLUMN IF NOT EXISTS "yfinance_ticker" text;

-- 2. Populate the standard tickers by appending .NS (and trimming any whitespace/newlines)
UPDATE public."Stocks" 
SET "yfinance_ticker" = TRIM("Ticker") || '.NS';

-- 3. Fix the specific mismatch for M&M which has a hidden newline character in the DB
UPDATE public."Stocks" 
SET "yfinance_ticker" = 'M&M.NS' 
WHERE "Stock" = 'Mahindra And Mahindra Ltd';
