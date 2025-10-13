import { ChangeEvent } from 'react';

import { useChain } from '../providers/ChainProvider';

export function ChainSwitcher() {
  const { chainKey, availableChains, setChain } = useChain();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setChain(event.target.value as typeof chainKey);
  };

  return (
    <label className="chain-switcher">
      <span>Chain</span>
      <select value={chainKey} onChange={handleChange}>
        {availableChains.map((chain) => (
          <option key={chain.key} value={chain.key}>
            {chain.name}
          </option>
        ))}
      </select>
    </label>
  );
}
