import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const pool = new pg.Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
});


app.get('/players-scores', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          players.name AS player_name,
          games.title AS game_title,
          scores.score
        FROM scores
        INNER JOIN players ON scores.player_id = players.id
        INNER JOIN games ON scores.game_id = games.id
      `);
  
      res.json(result.rows);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.get('/top-players', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          players.name AS player_name,
          SUM(scores.score) AS total_score
        FROM 
          scores
        JOIN players ON scores.player_id = players.id
        GROUP BY players.name
        ORDER BY total_score DESC
        LIMIT 3
      `);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching top players:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/inactive-players', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          players.name AS player_name
        FROM 
          players
        LEFT JOIN scores ON players.id = scores.player_id
        WHERE 
          scores.id IS NULL
      `);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching inactive players:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.get('/popular-genres', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          genres.name AS genre_name,
          COUNT(scores.id) AS times_played
        FROM 
          scores
        JOIN games ON scores.game_id = games.id
        JOIN genres ON games.genre_id = genres.id
        GROUP BY genres.name
        ORDER BY times_played DESC
      `);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching popular genres:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/recent-players', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT name, created_at
        FROM players
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching recent players:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/favorite-games', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT player_name, game_title, play_count FROM (
          SELECT
            players.name AS player_name,
            games.title AS game_title,
            COUNT(scores.id) AS play_count,
            ROW_NUMBER() OVER (PARTITION BY players.id ORDER BY COUNT(scores.id) DESC) AS rank
          FROM scores
          JOIN players ON scores.player_id = players.id
          JOIN games ON scores.game_id = games.id
          GROUP BY players.id, players.name, games.title
        ) AS ranked
        WHERE rank = 1;
      `);
  
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching favorite games:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  
  


app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});


