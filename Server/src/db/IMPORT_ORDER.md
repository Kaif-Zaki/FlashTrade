Import these files in this order to avoid relationship errors:

1. `SampleUsers.json`
2. `SampleCategoory.json`
3. `SampleProduts.json`
4. `SampleCommissionRules.json`
5. `SampleOrders.json`
6. `SampleReviews.json`
7. `SampeCustomerMessage .json`

Example commands (from project root):

```bash
mongoimport --uri "$DB_URL" --collection users --file Server/src/db/SampleUsers.json --jsonArray
mongoimport --uri "$DB_URL" --collection categories --file Server/src/db/SampleCategoory.json --jsonArray
mongoimport --uri "$DB_URL" --collection products --file Server/src/db/SampleProduts.json --jsonArray
mongoimport --uri "$DB_URL" --collection commissionrules --file Server/src/db/SampleCommissionRules.json --jsonArray
mongoimport --uri "$DB_URL" --collection orders --file Server/src/db/SampleOrders.json --jsonArray
mongoimport --uri "$DB_URL" --collection customerreviews --file Server/src/db/SampleReviews.json --jsonArray
mongoimport --uri "$DB_URL" --collection customermessages --file "Server/src/db/SampeCustomerMessage .json" --jsonArray
```

Notes:
- Existing data may conflict with `_id` or unique `email`/`name` fields.
- Use a fresh database or drop conflicting collections before import.
