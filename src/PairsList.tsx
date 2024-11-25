import { useContext } from 'react';
import { ctx } from './App';
import * as Utils from './Utils';

export default function PairsList(
  { seleted, allPairs, updateParent }: {
    seleted: Array<string>,
    allPairs: Array<string>,
    updateParent: (_pair: string) => void
  }
) {

  const _ctx = useContext(ctx)
  return (
    <>
      <div className="pairs_view">
        <ul className="pairs_list">
          {allPairs.map((pair) => (
            <button key={pair + "in_list"}
            style={{color: seleted.includes(pair) ? 'yellow' : 'white'}}
            className="pair_name" onClick={() => updateParent(pair)}>
              {Utils.GetNamesByUniqueId(pair, _ctx.tokens, " / ")
                .map((name) => (
                  <div key={name + " on " + pair}>{name}</div>
                ))}
            </button>))}
        </ul>
      </div>
    </>
  )
}
