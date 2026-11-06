// TODO(team) · Task 1
// Props: name (string), links (array of { href, label }).
// Returns a <header> with an <h1> holding the name and a
// <nav aria-label="Principal"> with a <ul> that has one <li><a href> per link.
export default function Header({ name, links }) {
  return (
    <header>
      <h1>{name}</h1>
      <nav aria-label="Principal">
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}