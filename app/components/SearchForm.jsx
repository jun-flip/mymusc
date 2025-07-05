import React from 'react';

function SearchForm({ query, setQuery, onSubmit, inputRef }) {
  return (
    <div className="search-form-wrapper">
      <form className="search-form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск трека..."
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Поиск</button>
      </form>
    </div>
  );
}

export default SearchForm; 