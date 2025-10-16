# Blogcells

A blog web application where users can create, read, and interact with blog posts through comments and likes. Built with a clean, responsive design that allows writers to share their thoughts and readers to engage with content. A demo of the app can be found through this link [https://drive.google.com/file/d/1RS3xFCqgAiJHtbu3laanLfSTznuTugma/view].

## Tech Stack

- **Frontend**: TailwindCSS
- **Backend**: Node.js (Express.js)
- **Database**: PostgreSQL

## Setup Guide

### Prerequisites

- Node.js (>= 18.x)
- npm (>= 9.x)
- PostgreSQL running locally

### Clone the Repository

```bash
git clone https://github.com/yanicells/Blogcells.git
cd blog-web-application
```

### Install Dependencies

```bash
npm install
```

(Optional) Install nodemon globally:

```bash
npm install -g nodemon
```

### Database Setup

Make sure PostgreSQL is running. [Install PostgreSQL](https://www.postgresql.org) if you haven't.
No need to create a table, just create a database, and make sure it connects to the terminal (or command prompt) once you have.

#### Create a database:

```sql
CREATE DATABASE BlogDB;
```

### Environment Variables

Create a `.env` file in the root directory.
Fill in the information. The port should be 5432 by default.

```env
DBUSER=""
DBHOST=""
DBNAME=""
DBPASS=""
DBPORT=5432
```

### Run the Project

```bash
# Start with nodemon
nodemon index.js
```

Project will be available at: http://localhost:3000

## Usage

1. Open the landing page at `/`.
2. Register or log in as a user.
3. Read through the different blog post.
4. Interact with others through liking or commenting.
5. Post your own blog.
