// TODO(team) · Task 2
// Props: contact = { address, phone, email }.
// Returns a <footer> with the address, a link whose href starts with tel:
// and a link whose href starts with mailto:.
export default function Footer({ contact }) {
  return (
    <footer>
      <p>{contact.address}</p>
      <p>
        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
      </p>
      <p>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
    </footer>
  );
}