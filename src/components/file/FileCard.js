/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper, Card, CardContent, CardHeader, CardActions, Avatar, IconButton,
} from '@material-ui/core';
import {
  Save, SaveOutlined, Pageview, PageviewOutlined, DeleteSweepOutlined, CancelOutlined,
} from '@material-ui/icons';
import { BlockEditable } from 'markdown-translatable';
import { CompositionDemo } from 'usfm-editor';

const useStyles = makeStyles(theme => ({
  actions: {
    textAlign: 'right',
    paddingRight: `${theme.spacing(1.5)}px`,
    width: '100%',
  },
  action: {
    marginLeft: `0px`,
  },
}));

function FileCard({
  authentication,
  repository,
  file,
}) {
  const classes = useStyles();
  const [preview, setPreview] = useState(true);
  const [markdown, setMarkdown] = useState(file ? file.content : '');
  const changed = (markdown !== (file && file.content));
  const avatarUrl = repository.avatar_url || repository.owner.avatar_url;
  const access = repository.permissions.push;

  useEffect(() => {
    setMarkdown(file && file.content);
  }, [file]);

  const branch = (file && file.branch) ? file.branch : repository.default_branch;

  const isUSFM = /\.usfm$/.test(file.path);
  const editor = isUSFM ? (
    <CompositionDemo usfmString={file.content}/>
  ) : (
    <BlockEditable
      preview={preview}
      markdown={markdown}
      onEdit={setMarkdown}
      editable={!!authentication}
    />
  );

  return (
    <Card>
      <CardHeader
        avatar={<Avatar src={avatarUrl} />}
        title={<strong>{file && file.path}</strong>}
        subheader={repository.full_name + '/' + branch}
      />
      <CardContent>
        <Paper>
          {editor}
        </Paper>
      </CardContent>
      <CardActions>
        <div className={classes.actions}>
          <IconButton className={classes.action} aria-label="Preview" onClick={() => setPreview(!preview)}>
            {!preview ? <Pageview /> : <PageviewOutlined />}
          </IconButton>
          <IconButton
            className={classes.action}
            aria-label="Save"
            disabled={!access}
            onClick={() => {
              if (changed) file.save(markdown);
            }}
          >
            {changed ? <Save /> : <SaveOutlined />}
          </IconButton>
          <IconButton
            className={classes.action}
            aria-label="Delete"
            disabled={!access}
            onClick={() => {
              const confirmation = window.confirm(
                `Are you sure you want to Delete ${file.filepath}?`
              );

              if (confirmation) file.dangerouslyDelete();
            }}
          >
            <DeleteSweepOutlined />
          </IconButton>
          <IconButton
            title="Close Repository"
            onClick={file.close}
          >
            <CancelOutlined />
          </IconButton>
        </div>
      </CardActions>
    </Card>
  );
};

FileCard.propTypes = {
  /** Repository tree_url can be used in place of blobConfig */
  repository: PropTypes.shape({
    owner: PropTypes.shape({
      username: PropTypes.string.isRequired,
      avatar_url: PropTypes.string.isRequired,
    }),
    name: PropTypes.string.isRequired,
    avatar_url: PropTypes.string,
  }).isRequired,
  /** Pass a previously returned file object to bypass the selection. */
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    sha: PropTypes.string.isRequired,
    content: PropTypes.string,
    branch: PropTypes.string,
    filepath: PropTypes.string,
  }),
  /** Pass a previously returned authentication object to bypass login. */
  authentication: PropTypes.shape({
    user: PropTypes.object.isRequired,
    token: PropTypes.object.isRequired,
    config: PropTypes.object.isRequired,
  }),
};

export default FileCard;
