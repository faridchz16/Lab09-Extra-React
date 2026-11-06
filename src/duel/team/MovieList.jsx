// Task 5 · The billboard: one card per movie.
// Props: movies (array of movie objects).
import MovieCard from "./MovieCard.jsx";

export default function MovieList({ movies }) {
  return (
    <ul className="movie-list">
      {/* The key is the movie id, so each movie keeps its own DOM node when the list changes. */}
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}
