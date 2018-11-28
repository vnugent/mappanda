import * as React from "react";
import "./App.css";
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps
} from "react-router-dom";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import { Toolbar } from "@material-ui/core";

import MyMap from "./MyMap";
import DefaultURLHandler from "./DefaultURLHandler";
import Editor from "./Editor";
import * as restClient from "./RestClient";
import ShowPandaURLHandler from "./ShowPandaURLHandler";
import ShowPanda from "./ShowPanda";

const uuidv1 = require("uuid/v1");

const styles = {
  root: {
    flexGrow: 1
  },
  grow: {
    flexGrow: 1
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20
  }
};

interface IAppProps extends RouteComponentProps {
  classes: any;
}

interface IAppState {
  geojson: any;
  uuid: string;
  mode: string;
  latlng?: { lat: number; lng: number };
}

class App extends React.Component<IAppProps, IAppState> {
  private editorRef;
  constructor(props: IAppProps) {
    super(props);
    this.state = {
      geojson: undefined,
      uuid: uuidv1(),
      mode: "edit",
      latlng: undefined
    };
    this.editorRef = React.createRef();
  }

  onShareButtonClick = e => {
    console.log("## onShareButtonClick()");
    const uri = `/p/${this.state.uuid}`;
    restClient.create(this.state.uuid, this.state.geojson);
    this.setState({ mode: "sharing" }, () => this.props.history.push(uri));
  };

  onNewButtonClick = e => {
    if (this.state.geojson && this.editorRef) this.editorRef.clear();
    this.setState(
      {
        uuid: uuidv1(),
        mode: "edit",
        geojson: undefined
      },
      () => {
        const latlng = this.state.latlng;
        if (latlng) {
          this.props.history.replace(`/@${latlng.lat}/${latlng.lng}/12`);
        } else this.props.history.push("/");
      }
    );
  };

  onChange = newGeojson => {
    this.setState({ geojson: newGeojson });
  };

  onInitialized = (_latlng: { lat; lng: number }) => {
    console.log("setting initial URL", _latlng);
    this.setState({ latlng: _latlng }, () =>
      this.props.history.push(`/@${_latlng.lat}/${_latlng.lng}/12`)
    );
  };

  private shouldDisableShareButton = () => {
    const geojson = this.state.geojson;
    return this.state.mode === "edit" &&
      geojson &&
      geojson.features &&
      geojson.features.length > 0
      ? true
      : false;
  };

  public render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar color="">
            <Typography variant="h6" color="inherit">
              MapPandas
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              className={classes.button}
              onClick={this.onShareButtonClick}
              disabled={!this.shouldDisableShareButton()}
            >
              Share
            </Button>
            <Button
              color="inherit"
              onClick={this.onNewButtonClick}
            >
              New
            </Button>
          </Toolbar>
        </AppBar>
        <Switch>
          <Route
            path="/@:lat?/:lng?/:zoom?"
            render={props => (
              <MyMap {...props}>
                <Editor
                  ref={ref => (this.editorRef = ref)}
                  onChange={this.onChange}
                />
              </MyMap>
            )}
          />
          <Route
            path="/p/:uuid"
            render={props =>
              this.state.mode === "sharing" ? (
                <ShowPanda geojson={this.state.geojson} />
              ) : (
                <ShowPandaURLHandler {...props} />
              )
            }
          />
          <Route
            render={props => (
              <DefaultURLHandler
                {...props}
                onInitialized={this.onInitialized}
              />
            )}
          />
        </Switch>
      </div>
    );
  }
}

const RRApp = withRouter(App);
export default withStyles(styles)(RRApp);
