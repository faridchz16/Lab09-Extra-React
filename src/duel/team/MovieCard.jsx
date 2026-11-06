// Task 3 · A movie card: poster, title and rating.
// Props: movie = { id, title, image, synopsis, rating, showtimes }.
export default function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      <img src={movie.image} alt={movie.title} />
      <h3>{movie.title}</h3>
      <p>★ {movie.rating}</p>
    </article>
  );
}
