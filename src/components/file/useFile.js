import React, {
  useState, useCallback, useContext,
  useEffect, useMemo
} from 'react';
import PropTypes from 'prop-types';
import useDeepCompareEffect from 'use-deep-compare-effect';

import {
  getContentFromFile, saveFile, ensureFile, deleteFile,
} from './helpers';
import {
  FileCard, FileForm, useBlob, RepositoryContext,
} from '..';
import {fetchCatalogContent} from './dcsCatalogNextApis';

function useFile({
  authentication,
  repository,
  filepath,
  onFilepath,
  defaultContent,
  config: _config,
  create=false,
  onOpenValidation,
  onConfirmClose,
}) {
  const [file, setFile] = useState();
  const [isChanged, setIsChanged] = useState(false);
  const [blob, setBlob] = useState();

  const { actions: { updateBranch }, config: repositoryConfig } = useContext(RepositoryContext);

  const config = _config || repositoryConfig;
  const branch = repository && (repository.branch || repository.default_branch);

  const [deleted, setDeleted] = useState();

  const _setBlob = useCallback((blob) => {
    if (blob && isChanged && onConfirmClose) {
      if (onConfirmClose())
      {
        setBlob(blob);
      }
    } else{
      setBlob(blob);
    }
  },[isChanged, blob, file, setBlob, onConfirmClose]);

  const {
    state: blobState, actions: blobActions, components: blobComponents,
  } = useBlob({
    blob, onBlob: _setBlob, config, repository, filepath,
  });

  const { push: writeable } = (repository && repository.permissions) ? repository.permissions : {};

  const update = useCallback((_file) => {
    setFile(_file);
  }, []);

  useEffect(() => {
    setIsChanged(false);
  }, [file, deleted, closed]);

  const read = useCallback(async (_filepath) => {
    if (onFilepath) {
      await onFilepath(_filepath);
    };
  }, [onFilepath]);

  const load = useCallback(async () => {
    if (config && repository && filepath) {
      const _file = await ensureFile({
        filepath, defaultContent, authentication, config, repository, branch, onOpenValidation,
      });
      // let content;
      // content = await repositoryActions.fileFromZip(filepath);
      const content = await getContentFromFile(_file);
      const prodTag = repository.catalog?.prod?.branch_or_tag_name;
      let _publishedContent;
      if ( prodTag ) {
        _publishedContent = await fetchCatalogContent('unfoldingword', repository.name, prodTag, filepath, config);
      }
      update({
        ..._file, branch, content, filepath: _file.path, publishedContent: _publishedContent,
      });
    }
  }, [authentication, branch, config, defaultContent, filepath, repository, update]);

  const createFile = useCallback(async ({
    branch: _branch, filepath: _filepath, defaultContent: _defaultContent, onOpenValidation,
  }) => {
    if (config && repository) {
      const _file = await ensureFile({
        authentication, config, repository,
        branch: _branch,
        filepath: _filepath,
        defaultContent: _defaultContent,
        onOpenValidation,
      });

      if (_file) {
        updateBranch(_branch);
        onFilepath(_filepath);
      };
    }
  }, [authentication, config, repository, updateBranch, onFilepath]);

  const close = useCallback(() => {
    if (blobActions && blobActions.close) {
      blobActions.close();
    };

    if (onFilepath) {
      onFilepath();
    };
    update();
  }, [update, blobActions, onFilepath]);

  const save = useCallback(async (content) => {
    await saveFile({
      authentication, repository, branch, file, content,
    }).then(() => {
      load();
    });
  }, [writeable, authentication, repository, branch, file, load]);

  const dangerouslyDelete = useCallback(async () => {
    if (writeable) {
      const _deleted = await deleteFile({
        authentication, repository, file, branch,
      });

      if (_deleted) {
        setDeleted(true);
      }
    };
  }, [file, authentication, branch, repository, writeable]);

  useDeepCompareEffect(() => {
    const notLoaded = (!file && filepath && !deleted);
    const loadNew = (file && filepath && file.filepath !== filepath);

    if (notLoaded || loadNew) {
      load();
    }
  }, [deleted, filepath, load, file]);

  const blobFilepath = blobState && blobState.filepath;

  useEffect(() => {
    if (blobFilepath && onFilepath) {
      onFilepath(blobFilepath);
    };
  }, [blobFilepath, onFilepath]);

  useDeepCompareEffect(() => { // if there is a file but no repository, close file.
    if (!repository && file) close();
  }, [repository, file, close]);

  useEffect(() => {
    if (deleted) {
      close();
      setDeleted(false);
    };
  }, [deleted, close]);

  const actions = {
    update,
    load,
    read,
    save,
    close,
    dangerouslyDelete,
    setIsChanged,
    onConfirmClose,
  };

  const components = {
    create: repository && (
      <FileForm
        branch={branch}
        defaultContent={defaultContent}
        onSubmit={createFile}
      />
    ),
    browse: repository && blobComponents.browse,
    fileCard: repository && file && (
      <FileCard
        authentication={authentication}
        repository={repository}
        file={{ ...file, ...actions }}
      />
    ),
  };

  let component = <></>;

  if (file) {
    component = components.fileCard;
  } else if (!filepath) {
    if (create) {
      component = components.create;
    } else {
      component = components.browse;
    }
  }

  return {
    state: file,
    stateValues: {isChanged},
    actions,
    component,
    components,
  };
};

useFile.propTypes = {
  /** The full filepath for the file. */
  filepath: PropTypes.string,
  /** Function to propogate filepath when the Blob is selected. */
  onFilepath: PropTypes.func,
  /** Authentication object returned from a successful withAuthentication login. */
  authentication: PropTypes.shape({
    config: PropTypes.shape({
      server: PropTypes.string.isRequired,
      headers: PropTypes.shape({ Authorization: PropTypes.string.isRequired }).isRequired,
    }).isRequired,
    user: PropTypes.shape({
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }).isRequired,
  }),
  /** Repository tree_url can be used in place of blobConfig */
  repository: PropTypes.shape({
    owner: PropTypes.shape({ username: PropTypes.string.isRequired }),
    name: PropTypes.string.isRequired,
  }).isRequired,
  /** use a form to create a new file */
  create: PropTypes.bool,
};

export default useFile;
