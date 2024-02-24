import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "!CryoGoat122",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 3;

// let users = [
//   { id: 1, name: "Angela", color: "teal" },
//   { id: 2, name: "Jack", color: "powderblue" },
// ];

/***********************************************************/
/******          Custom Functions                     ******/
/***********************************************************/
// GET array of countries a uesr has been to
async function checkVisisted() {
  // const result = await db.query("SELECT country_code FROM visited_countries");
  const result = await db.query(
    "SELECT * FROM visited_countries AS v JOIN users AS u ON u.id = user_id JOIN countries AS c ON c.id = country_id WHERE u.id = $1", 
    [currentUserId]
  );

  let countries = [];
  result.rows.forEach( (country) => {
    countries.push(country.country_code);
  });
  return countries;
}

// GET array of users 
async function getUsers() {
  const result = await db.query("SELECT * FROM users");
  // DEBUGGING
  // console.log(result.rows);

  let users = [];
  result.rows.forEach( (user) => {
    users.push(
      {
        id: user.id,
        name: user.name, 
        color: user.color 
      }
    );
  });
  return users;
}


/***********************************************************/
/******             Route Handling                    ******/
/***********************************************************/
// GET Homepage
app.get("/", async (req, res) => {
  // Get user data
  try {
    let countries = await checkVisisted();
    let users =  await getUsers();
    const userIdx = users.findIndex( (user) => parseInt(currentUserId) === parseInt(user.id));
   
    // console.log("currentUserID = " + currentUserId);
    // console.log("userIdx = " + userIdx);

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: users[userIdx].color,
    });

  } catch (error) {
    console.log(error);
  }
  
});

// INSERT new country for user
app.post("/add", async (req, res) => {
  // Get country and user
  const country_name = req.body["country"];
  const user_id = currentUserId;   

  try {
    const result = await db.query(
      "SELECT id FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [country_name.toLowerCase()]
    );

    const data = result.rows[0];
    const country_id = data.id;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_id, user_id) VALUES ($1, $2)",
        [country_id, user_id]
      );
      res.redirect("/");
    } catch (err) {+
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

// UPDATE to the correct user to ADD new user
app.post("/user", async (req, res) => {
  if(req.body.add){
    console.log(req.body.add);
    res.render("new.ejs");
  }else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
  
});

// INSERT new user
app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  // GET name and color for user
  const name = req.body.name;
  const color = req.body.color;

  // Add user to database
  const result = await db.query(
    "INSERT INTO users(name, color) VALUES($1, $2) RETURNING *", 
    [name, color]
  );
  // Update current user
  currentUserId = result.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
