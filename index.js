import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const app = express ();
const port = 3000;


//Database connection 
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"recipes",
    password:"!Citroenschil1",
    port: 5432
});
db.connect();

//Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//GET Request /index.ejs
app.get("/", (req, res) => {
    res.render("index.ejs");
});

//GET request /submit.ejs
app.get("/submit", (req, res) => {
    res.render("submit.ejs");
});

//GET Request /recipe.ejs
app.get("/recipe", async (req, res) => {
    try {
      const recipeQuery = await db.query("SELECT * FROM recipes");
      const recipes = recipeQuery.rows;
      
      // Generate a random index within the range of recipes array
      const randomIndex = Math.floor(Math.random() * recipes.length);
      const randomRecipe = recipes[randomIndex];
      
      const ingredientQuery = await db.query("SELECT * FROM ingredients WHERE recipe_id = $1",
      [randomRecipe.id]);
      const ingredients = ingredientQuery.rows;
        
      // Render index.ejs with the random recipe
      res.render("recipe.ejs", { randomRecipe, ingredients });
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).send("Internal Server Error");
    }
  });

//POST Request, when recipe is added into database 
app.post("/submit", async (req, res) => {
 const name = req.body.creator;
 const recipeName = req.body.recipeName;
 const ingredients = req.body.ingredients;
 const preparationSteps = req.body.preparationSteps;
 const quantities = req.body.quantity;

    //insert data into recipes
 try {
   const recipeResult = await db.query(
        "INSERT INTO recipes (recipe_name, creator, preparation_steps) VALUES ($1, $2, $3) RETURNING id",
        [recipeName, name, preparationSteps]
    );

//TO REVIEW THE PART BELOW

    //extract recipe id
    const recipeId = recipeResult.rows[0].id;

    //insert all ingredients/quantity into ingredients
    for (let i=0; i < ingredients.length; i++) {
        const ingredient = ingredients[i]; 
        const quantity = quantities[i];
 
        await db.query(
        "INSERT INTO ingredients (recipe_id, ingredient_name, quantity) VALUES ($1, $2, $3)",
        [recipeId, ingredient, quantity]
    );
    }

    //redirect to homepage
    res.redirect("/");

} catch (err) {
    console.log(err);
    }
});


//Port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})