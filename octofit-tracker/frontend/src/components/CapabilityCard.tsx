import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  collection: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

type State<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: T[] };

export function CapabilityCard<T>({ title, description, path, collection, emptyMessage, renderItem }: Props<T>) {
  const [state, setState] = useState<State<T>>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;
    getJson<Record<string, unknown>>(path)
      .then((response) => {
        const items = response[collection];
        if (mounted) {
          setState({ status: 'success', items: Array.isArray(items) ? items as T[] : [] });
        }
      })
      .catch(() => {
        if (mounted) setState({ status: 'error' });
      });
    return () => {
      mounted = false;
    };
  }, [collection, path]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}…</p>}
        {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}.</p>}
        {state.status === 'success' && (state.items.length === 0
          ? <p>{emptyMessage}</p>
          : <ul>{state.items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>)}
      </div>
    </section>
  );
}
