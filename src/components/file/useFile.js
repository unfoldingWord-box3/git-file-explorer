import React, {
  useState, useCallback, useContext,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import useDeepCompareEffect from 'use-deep-compare-effect';

import {
  getContentFromFile, saveFile, ensureFile, deleteFile,
} from './helpers';
import {
  FileCard, FileForm, useBlob, RepositoryContext,
} from '..';

function useFile({
  authentication,
  repository,
  filepath,
  onFilepath,
  defaultContent,
  config: _config,
  create=false,
  onOpenValidation,
  onLoadCache,
  onSaveCache,
}) {
  const [file, setFile] = useState();
  const [blob, setBlob] = useState();
  const { actions: { updateBranch }, config: repositoryConfig } = useContext(RepositoryContext);

  const config = _config || repositoryConfig;
  const branch = repository && (repository.branch || repository.default_branch);

  const [deleted, setDeleted] = useState();

  const {
    state: blobState, actions: blobActions, components: blobComponents,
  } = useBlob({
    blob, onBlob: setBlob, config, repository, filepath,
  });

  const { push: writeable } = (repository && repository.permissions) ? repository.permissions : {};

  const update = useCallback((_file) => {
    setFile(_file);
  }, []);

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

      console.log("ensureFile:");
      console.log(_file);

      let defaultCachedContentFile;
      // if (loadDefaultCachedContentFile) { 
      //   console.log("_file.html_url");
      //   console.log(_file.html_url);
      //   defaultCachedContentFile = await loadDefaultCachedContentFile(_file.html_url);
      // }
      console.log("GRT // onLoadCache!", _file, _file.html_url);
      if (onLoadCache && _file && _file.html_url)
      {
        defaultCachedContentFile = await onLoadCache({authentication, repository, branch, html_url: _file.html_url});
      }
      
      console.log("GRT defaultContent", '|', defaultContent);
      console.log("GRT defaultCachedContent", '|', defaultCachedContentFile);

      if (defaultCachedContentFile)
      {
        console.log(defaultCachedContentFile.sha);
      }
      if (_file) {
        console.log(_file.sha);
      }

      // let content;
      // content = await repositoryActions.fileFromZip(filepath);

      //const content = await getContentFromFile(_file);

      // Allow app to provide CACHED ("offline" content);
      // Might be different BRANCH (different user) or different FILE.
      // Might be STALE (sha has changed on DCS).
      // (NOTE: STALE cache would mean THIS user edited the same file in another browser.)
      let content;
      if (defaultCachedContentFile 
          && defaultCachedContentFile.content 
          && defaultCachedContentFile.sha 
          && defaultCachedContentFile.html_url 
          && defaultCachedContentFile.filepath 
          && defaultCachedContentFile.timestamp 
          && defaultCachedContentFile.sha == _file.sha
          && defaultCachedContentFile.html_url == _file.html_url
      ) {
        content = defaultCachedContentFile.content;
      } else {
        if (_file && _file.content 
            && defaultCachedContentFile && defaultCachedContentFile.content 
            && defaultCachedContentFile.filepath && defaultCachedContentFile.sha
            && defaultCachedContentFile.timestamp) {
          console.log("alert");
          console.log(_file);
          console.log(defaultCachedContentFile);
          alert(
            "A previous file was autosaved. The autosaved file will be overwritten.\n\n" +
            "File: " + defaultCachedContentFile.filepath + ".\n" +
            "Edited: " + defaultCachedContentFile.timestamp.toLocaleString() + "."
          );
        }
        content = await getContentFromFile(_file);
      }

      update({
        ..._file, branch, content, filepath: _file.path,
      });
    }
  }, [authentication, branch, config, defaultContent, onLoadCache, filepath, repository, update]);

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
    console.log("GRT save // will save file");
    await saveFile({
      authentication, repository, branch, file, content,
    }).then(
      // Empty cache if user has saved this file
      // (save() will not happen for "OFFLINE" system files)
      async() => {
        console.log("GRT save // will EMPTY cache");
        await saveCache(null); 
        
        console.log("GRT save // will load file");
        await load();
      }
    );
  }, [writeable, authentication, repository, branch, file, load, saveFile, saveCache]);

  const saveCache = useCallback(async (content) => {
    if (onSaveCache) {
      await onSaveCache({authentication, repository, branch, file, content});
    }
  }, [writeable, authentication, repository, branch, file, onSaveCache]);

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
    saveCache,
    onSaveCache,
    onLoadCache,
    close,
    dangerouslyDelete,
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
