# Project Title: Prisma Express Valoritario

This project is built on Express and Prisma with databases in Postgres and Redis! The function of the app is to first create a user account. 
Then, a user can enter their shopping list (item name and quantity) and the city they want to go shopping in. The app will find the lowest price 
for each item and return the location within the city that carries it, along with the subtotal for each item. At the bottom, it will show the 
sum of all subtotals, calculated using the `reduce()` function. This will save you tons of money!

## Prerequisites

I do not have PostgreSQL installed on my machine, so you might notice in docker-compose.yml, both postgres and redis images are being pulled.

Make sure you have installed all of the following prerequisites on your development machine:

- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/)
- A tool for managing environment variables, e.g. [Dotenv](https://www.npmjs.com/package/dotenv).
- A package manager, such as [npm](https://www.npmjs.com/get-npm) or [Yarn](https://classic.yarnpkg.com/en/docs/install/).

## Cloning the Repository

To get started, you need to clone the repository to your local machine. You can do this by running:

``sh
git clone https://github.com/aliabadihub/prisma-express-val.git

## Installing Dependencies
Navigate to the project directory and install the dependencies:


cd prisma-express-val
npm install


## Running the Application
Before running the application, you might need to build the TypeScript files if the repository doesn't contain the built files. Run the following command:

npm run build


## To run the application in development mode, use the following command:

npm run dev
This will start the server. You can access it by navigating to http://localhost:3333 in your browser.

## Accessing Swagger UI
You can also access the Swagger UI for interactive API documentation and testing at http://localhost:3333/api-docs.

## Contributing
I made this backend entirely on my own. It is the 3rd iteration, and there will likely be more in the future as I learn more techniques and newer versions are released.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.