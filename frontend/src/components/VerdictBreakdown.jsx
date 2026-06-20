import { CATEGORY_LABELS } from '../utils/constants';

export default function VerdictBreakdown({ details = [] }) {
  if (!details.length) return null;
  return (
    <table className="verdict-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Result</th>
          <th>Confidence</th>
          <th>Reasoning</th>
        </tr>
      </thead>
      <tbody>
        {details.map((v, i) => (
          <tr key={i}>
            <td>{CATEGORY_LABELS[v.category] || v.category}</td>
            <td className={v.result === 'violation' ? 'violation' : 'clean'}>{v.result}</td>
            <td>{v.confidence}%</td>
            <td>{v.reasoning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
