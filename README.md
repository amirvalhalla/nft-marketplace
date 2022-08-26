# Simple NFT MarketPlace

### Usage

- go to the project directory then run below commands

#### Install requirements

```
npm install
```

#### Usage

- For Run Test codes

```
npx hardhat test

tip: if you want to connect your test codes to localhost network like
ganache,hardhat node or other testnets like rinkeby you can use below

npx hardhat test --network <network-name>

E.g:
npx hardhat test --network localhost
npx hardhat test --network rinkeby
```

- For Deploy your Contract On testnet or mainnet , you should configure
  hardhat.config.js file also needs to put your environment variables into .env file

```
npx hardhat run --network <network-name> scripts/deploy.js

E.g:
npx hardhat run --network rinkeby scripts/deploy.js
```
