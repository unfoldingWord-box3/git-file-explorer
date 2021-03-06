import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  IconButton,
  ListItem,
  ListItemIcon,
  TextField,
} from '@material-ui/core';
import { Search } from '@material-ui/icons';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

import { repositorySearch } from '../..';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'sticky',
    borderRadius: theme.shape.borderRadius,
    marginLeft: 0,
    width: '100%',
  },
  listItemIcon: { marginRight: '8px' },
  form: { width: '100%' },
  input: {
    width: '40%',
    display: 'inline-block',
    marginRight: '1em',
  },
}));

function SearchForm({
  defaultOwner,
  defaultQuery,
  onRepositories,
  config,
}) {
  const classes = useStyles();
  const [owner, setOwner] = useState(defaultOwner);
  const [query, setQuery] = useState(defaultQuery);
  const [initialSearch, setInitialSearch] = useState(false);

  const repositorySearchDebounced = AwesomeDebouncePromise(
    async (_props) => { return await repositorySearch(_props) },
    250
  );

  const updateRepositories = useCallback(async (owner, query) => {
    const repositories = await repositorySearchDebounced({
      owner, query, config,
    });
    onRepositories(repositories);
  }, [config, onRepositories]);

  useEffect(() => {
    const _updateRepositories = async () => {
      await updateRepositories(owner, query);
      setInitialSearch(true);
    };

    if (!initialSearch) _updateRepositories();
  }, [initialSearch, owner, query, updateRepositories]);

  const onOwner = useCallback((_owner) => {
    setOwner(_owner);
    updateRepositories(_owner, query);
  }, [query, updateRepositories]);

  const onQuery = useCallback((_query) => {
    setQuery(_query);
    updateRepositories(owner, _query);
  }, [owner, updateRepositories]);

  return (
    <ListItem
      ContainerComponent="div"
      className={classes.root}
    >
      <ListItemIcon className={classes.listItemIcon}>
        <IconButton
          onClick={() => updateRepositories(owner, query)}
        >
          <Search />
        </IconButton>
      </ListItemIcon>
      <form className={classes.form}>
        <div className={classes.input}>
          <TextField
            id='owner' label='Owner' type='text'
            variant="outlined" margin="normal" fullWidth
            defaultValue={owner} autoComplete={undefined}
            onChange={(event) => {
              onOwner(event.target.value);
            }}
          />
        </div>
        <div className={classes.input}>
          <TextField
            id='search' label='Search' type='text'
            variant="outlined" margin="normal" fullWidth
            defaultValue={query} autoComplete={undefined}
            onChange={(event) => {
              onQuery(event.target.value);
            }}
          />
        </div>
      </form>
    </ListItem>
  );
}

SearchForm.propTypes = {
  /** Prefill the owner search field. */
  defaultOwner: PropTypes.string,
  /** Prefill the query search field. */
  defaultQuery: PropTypes.string,
  /** Function to propogate the returned repositories data array. */
  onRepositories: PropTypes.func.isRequired,
  /** Configuration required if paths are provided as URL. */
  config: PropTypes.shape({ server: PropTypes.string.isRequired }).isRequired,
};

export default SearchForm;
