// Task 1 · Page header: the cinema name and the main navigation.
// Props: name (string), links (array of { href, label }).
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
