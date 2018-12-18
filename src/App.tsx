import * as React from "react";
import "./App.css";
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps
} from "react-router-dom";
import { AppBar, Button, Toolbar, withStyles } from "@material-ui/core";
import { Edit as EditIcon } from "@material-ui/icons";
import { FeatureCollection } from "geojson";
import * as _ from "underscore";

import { IPanda } from "./types/CustomMapTypes";

import DefaultURLHandler from "./DefaultURLHandler";
import LatLngURLHandler from "./LatLngURLHandler";
import ShowPandaURLHandler from "./ShowPandaURLHandler";
import * as GeoHelper from "./GeoHelper";
import * as restClient from "./RestClient";
import LastN from "./Filters/LastN";
import PandaMetaEditor from "./PandaMetaEditor";
import MapNG from "./MapNG";
import ShareScreen from "./ShareScreen";

const styles = {
  root: {
  },
  grow: {
    flexGrow: 1
  },
  appBar: {
    backgroundColor: "transparent",
    zIndex: 1000
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
  panda: IPanda;
  editableJSON: FeatureCollection;
  mode: string;
  share_screen: boolean;
  viewstate: any;
}

class App extends React.Component<IAppProps, IAppState> {
  private editorRef;

  constructor(props: IAppProps) {
    super(props);
    this.state = {
      panda: GeoHelper.NEW_PANDA(),
      editableJSON: {
        type: "FeatureCollection",
        features: []
      },
      mode: "view",
      share_screen: false,
      viewstate: GeoHelper.INITIAL_VIEWSTATE
    };
    this.editorRef = React.createRef();
  }

  onShareButtonClick = () => {
    const uri = `/p/${this.state.panda.uuid}`;
    restClient.create(this.state.panda);
    localStorage.setItem(
      this.state.panda.uuid,
      GeoHelper.stringify(this.state.panda)
    );
    this.setState({ mode: "share", share_screen: true });

    this.props.history.replace(uri);
  };

  onNewButtonClick = () => {
    if (
      this.state.panda.geojson &&
      this.editorRef &&
      typeof this.editorRef.clear === "function"
    ) {
      this.editorRef.clear();
    }

    this.setState(
      {
        mode: "edit",
        panda: GeoHelper.NEW_PANDA(),
        editableJSON: GeoHelper.NEW_FC()
      },
      () => {
        this.props.history.push("/", { dontMoveMap: true });
      }
    );
  };

  onDataLoaded = (data: IPanda, editable: boolean): void => {
    console.log("App.onDataLoaded()", data.geojson);
    console.log("  viewport: ", this.state.viewstate);
    const newViewstate = {
      ...this.state.viewstate,
      ...GeoHelper.bbox2Viewport(data.bbox)
    };
    console.log("  new viewport: ", newViewstate);

    this.setState({
      mode: "share",
      panda: data,
      editableJSON: data.geojson,
      viewstate: newViewstate
    });
  };

  onEditUpdated = (geojson: FeatureCollection) => {
    const newPanda = this.state.panda;
    newPanda.geojson = geojson;
    newPanda.bbox = GeoHelper.bboxFromGeoJson(geojson);
    console.log("App.onEditUpdate() ", geojson);
    this.setState({
      editableJSON: geojson,
      panda: newPanda
      //viewstate: GeoHelper.bounds2Viewport(newPanda.bbox)
    });
  };

  onInitialized = (_viewstate: any) => {
    console.log("setting initial URL", _viewstate);
    this.setState({ viewstate: _viewstate });
  };

  onViewstateChanged = _viewstate => {
    console.log("## new view ", _viewstate);
    const newVS = _viewstate.viewState
      ? _viewstate.viewState
      : { ...this.state.viewstate, ..._viewstate };
    this.setState({ viewstate: newVS });
  };

  onDescriptionUpdate = (event: any) => {
    const currentPanda = this.state.panda;
    currentPanda.description = event.target.value;
    this.setState({ panda: currentPanda });
  };
  private isSharable = () => {
    const geojson = this.state.panda.geojson;
    const flag =
      this.state.mode === "edit" &&
      geojson &&
      geojson.features &&
      geojson.features.length > 0 &&
      this.state.panda.description
        ? true
        : false;
    return flag;
  };

  onShareScreenClose = event => {
    this.setState(
      { share_screen: false },
      () => event.edit && this.onNewButtonClick()
    );
  };

  updateDimensions = _.debounce(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newViewport = Object.assign({}, this.state.viewstate);
    newViewport.width = width;
    newViewport.height = height - 50;
    this.setState({ viewstate: newViewport });
  }, 400);

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  public render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <AppBar position="static" className={classes.appBar}>
          <Toolbar className={classes.appBar}>
            <div id="search-container" className={classes.grow} />
            <Button
              color="primary"
              variant="contained"
              size="large"
              onClick={this.onNewButtonClick}
            >
              <EditIcon />
              &nbsp; Create New
            </Button>
          </Toolbar>
        </AppBar>
        <div className="mapng-container">
          <MapNG
            editable={this.state.mode === "edit"}
            geojson={this.state.editableJSON}
            viewstate={this.state.viewstate}
            onViewStateChanged={this.onViewstateChanged}
            onEditUpdated={this.onEditUpdated}
          />
        </div>
        <ShareScreen
          classes={classes}
          panda={this.state.panda}
          open={this.state.share_screen}
          onClose={this.onShareScreenClose}
        />
        <PandaMetaEditor
          editable={this.state.mode === "edit"}
          description={this.state.panda.description}
          onDescriptionUpdate={this.onDescriptionUpdate}
          sharable={this.isSharable()}
          onShare={this.onShareButtonClick}
        />
        <LastN />
        <Switch>
          <Route
            path="/@:lat?/:lng?/:zoom?"
            render={props => (
              <LatLngURLHandler
                {...props}
                onLatLngChanged={this.onViewstateChanged}
              />
            )}
          />
          <Route
            path="/p/:uuid/:edit?"
            render={props => (
              <ShowPandaURLHandler
                key={props.location.key}
                {...props}
                onDataLoaded={this.onDataLoaded}
              />
            )}
          />
          } />
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
