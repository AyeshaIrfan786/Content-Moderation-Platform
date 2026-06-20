export default function VerdictBadge({ outcome }) {
  return <span className={`badge badge-${outcome}`}>{outcome}</span>;
}
