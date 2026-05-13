


----Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT,
    allergies TEXT,
    default_servings INTEGER default 4,
    cuisine_preferences TEXT,
    measurement_units VARCHAR(50) DEFAULT 'metric',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- pantry Item table
CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity FLOAT NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- recipe table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL,
    servings INTEGER NOT NULL,
    difficulty VARCHAR(50),
    dietary_tags TEXT,
    user_notes TEXT,
    prep_time INTEGER, -- in minutes
    cook_time INTEGER, -- in minutes
    total_time INTEGER, -- in minutes
    cuisine VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

--recipe ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Nutritional Information table
CREATE TABLE IF NOT EXISTS recipe_nutrition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    calories FLOAT,
    protein FLOAT,
    carbohydrates FLOAT,
    fats FLOAT,
    fiber FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (recipe_id)
);

-- meal plan table
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    meal_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recipes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- shopping list table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    ingredients JSONB NOT NULL,
    quantity FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    from_meal_plan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_category ON pantry_items(category);

---function to update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

--- Trigger to update updated_at on users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--- Trigger to update updated_at on user_preferences table
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--- Trigger to update updated_at on pantry_items table
CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON pantry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--- Trigger to update updated_at on recipes table
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--- Trigger to update updated_at on recipe_ingredients table
CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--- Trigger to update updated_at on recipe_nutrition table
CREATE TRIGGER update_recipe_nutrition_updated_at BEFORE UPDATE ON recipe_nutrition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--- Trigger to update updated_at on meal_plans table
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();