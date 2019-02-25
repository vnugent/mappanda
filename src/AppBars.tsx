import * as React from "react";
import {
  AppBar,
  Typography,
  Button,
  Toolbar,
  withStyles,
  createStyles,
  Theme
} from "@material-ui/core";
import { FeatureCollection2 } from "@mappandas/yelapa";

const styles = (theme: Theme) =>
  createStyles({
    padding: {
      flexGrow: 1
    },
    title: {
      fontFamily: "serif",
      fontWeight: "bold",
      letterSpacing: "0.1em"
    },
    appBar: {
      position: "fixed",
      boxShadow: "none",
      backgroundColor: "white",
      [theme.breakpoints.up("xs")]: {
        width: "50%"
      },
      [theme.breakpoints.down("xs")]: {
        width: "100%"
      },
      left: 0,
      zIndex: 2000
    },
    editorSubMenu: {
      display: "flex",
      justifyContent: "flex-end",
      margin: 0,
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      paddingRight: theme.spacing.unit * 3
    }
  });

export interface IAppProps {
  classes?: any;
  data: FeatureCollection2;
  onCreateNewClick: () => void;
}

export interface IEditorProps {
  classes?: any;
  data: FeatureCollection2;
  onPublishClick: () => void;
}

export interface IAppState {}

class Editor extends React.Component<IEditorProps, IAppState> {
  constructor(props: IEditorProps) {
    super(props);
  }

  public render() {
    const { classes } = this.props;
    return (
      <div className={classes.editorSubMenu}>
        <div style={{ flexGrow: 2 }} />
        <Button
          variant="contained"
          color="primary"
          size="small"
          className={classes.padding}
          disabled={!this.isPublishable()}
          onClick={this.props.onPublishClick}
        >
          Publish
        </Button>
      </div>
    );
  }
  // allow publishing if there's 1 entry
  isPublishable = () => this.props.data.features.length > 0;
}

class TopLevelAppBar extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);
  }

  public render() {
    const { classes } = this.props;
    return (
      <div className={classes.appBar}>
        <AppBar
          position="sticky"
          style={{
            backgroundColor: "transparent"
          }}
        >
          <Toolbar>
            <Typography
              className={classes.title}
              variant="h6"
              color="inherit"
              noWrap
            >
              Map Pandas
            </Typography>
            <div className={classes.padding} />
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              className={classes.button}
              onClick={this.props.onCreateNewClick}
            >
              New Story
            </Button>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

export default withStyles(styles)(TopLevelAppBar);
const EditorAppBar = withStyles(styles)(Editor);
export { EditorAppBar };
