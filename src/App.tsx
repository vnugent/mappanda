import * as React from "react";
import {
  Route,
  Switch,
  withRouter,
  RouteComponentProps
} from "react-router-dom";
import { Grid, withStyles } from "@material-ui/core";
import { createStyles, Theme } from "@material-ui/core/styles";
import { FeatureCollection } from "geojson";

import * as _ from "underscore";
import { Value } from "slate";

import { IPost, LatLng, IActiveFeature } from "./types/CustomMapTypes";
import { FeatureCollection2 } from "@mappandas/yelapa";

import DefaultURLHandler from "./DefaultURLHandler";
import LatLngURLHandler from "./LatLngURLHandler";
import ShowPandaURLHandler from "./ShowPandaURLHandler";
import * as GeoHelper from "./GeoHelper";
import * as restClient from "./RestClient";
//import LastN from "./Filters/LastN";
import MapNG from "./MapNG";
import ShareScreen from "./ShareScreen";
import Switcher from "./Switcher";
import LocateMe from "./LocateMe";
import ScrollToTop from "./ScrollToTop";
import Popup from "./map/Popup";
import TextPane from "./TextPane";
import TopLevelAppBar from "./AppBars";

import { initialValue } from "./edit/slate-default";
import { computeGeojson, documentToGeojson } from "./document2geojson";
import SmartEditor from "./edit/SmartEditor";
const uuidv1 = require("uuid/v1");

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      height: "100vh",
      maxHeight: "100%",
      background: "#fafafa"
    },
    textPane: {
      width: "100%",
      height: "100%",
      paddingTop: "80px",
      paddingBottom: theme.spacing.unit * 3,
      boxSizing: "border-box",
      alignItems: "stretch"
    }
  });

const NEW_POST = (): IPost => ({
  uuid: uuidv1(),
  bbox: [0, 0, 0, 0],
  title: "",
  content: initialValue,
  userid: uuidv1()
});

interface IAppProps extends RouteComponentProps {
  classes: any;
}

interface IAppState {
  post: IPost;
  geojson: FeatureCollection;
  mode: string;
  share_screen: boolean;
  viewstate: any;
  mapStyle: string;
  myLocation: LatLng;
  hoveredFeature: IActiveFeature | null;
  publishable: boolean;
}

class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);
    this.state = {
      ...this.getState0()
    };
  }

  getState0 = (): IAppState => ({
    post: NEW_POST(),
    geojson: GeoHelper.NEW_FC(),
    mode: "edit",
    share_screen: false,
    viewstate: GeoHelper.INITIAL_VIEWSTATE(),
    mapStyle: "light-v9",
    myLocation: GeoHelper.DEFAULT_LATLNG,
    hoveredFeature: null,
    publishable: false
  });

  getStateNewEdit = () => ({
    post: NEW_POST(),
    mode: "edit",
    geojson: GeoHelper.NEW_FC(),
    publishable: false
  });

  onNewButtonClick = () => {
    document.title = "MapPandas - Draft";
    this.setState(this.getStateNewEdit(), () => {
      this.props.history.push("/", { dontMoveMap: true });
    });
  };

  /**
   * Handle new data from the backend
   */
  onDataLoaded = (post: IPost, editable: boolean): void => {
    if (post.content && post.content.document) {
      this.setState({ post, mode: "share" });
      const geojson = documentToGeojson(post.content.document);
      this.updateStateFromGeojson(geojson);
    }
  };

  onInitialized = (_viewstate: any) => {
    this.setState(this.getStateNewEdit());
    this._locateMe();
  };

  onViewstateChanged = _viewstate => {
    const newVS = _viewstate.viewState
      ? _viewstate.viewState
      : { ...this.state.viewstate, ..._viewstate };
    this.setState({ viewstate: newVS });
  };
  onShareScreenClose = event => {
    this.setState(
      { share_screen: false },
      () => event.edit && this.onNewButtonClick()
    );
  };

  onMapStyleChange = (style: string) => this.setState({ mapStyle: style });

  updateDimensions = _.debounce(() => {
    const { width, height } = this.getMapDivDimensions();
    const newViewport = Object.assign({}, this.state.viewstate);
    newViewport.width = width;
    newViewport.height = height;
    this.setState({ viewstate: newViewport });
  }, 400);

  getMapDivDimensions = () => {
    const div = document.getElementById("mapng");
    let width = 500;
    //let height = 250;
    if (div) {
      width = div.clientWidth;
      //height = div.clientHeight;
    }
    const height = window.innerHeight;
    return { width, height };
  };

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  public render() {
    const { classes } = this.props;
    const { mode, post } = this.state;
    return (
      <div className={classes.root}>
        <TopLevelAppBar
          readonly={mode === "share"}
          isPublishable={this.state.publishable}
          onCreateNewClick={this.onNewButtonClick}
          onPublishClick={this.onPublishClick}
        />
        <Grid spacing={0} container={true} alignContent="stretch">
          <Grid item xs={12} md={6}>
            <div id="text-pane-id" className={classes.textPane}>
              <TextPane>
                <SmartEditor
                  uuid={post.uuid}
                  content={post.content}
                  readonly={mode === "share"}
                  onLocationUpdate={this.onLocationUpdateHandler}
                  onContentChange={this.onContentChange}
                />
              </TextPane>
            </div>
          </Grid>
          <Grid item xs={12} md={6}>
            <div
              id="mapng"
              style={{
                padding: 0,
                position: "relative"
              }}
            >
              <MapNG
                geojson={this.state.geojson}
                viewstate={this.state.viewstate}
                onViewStateChanged={this.onViewstateChanged}
                mapStyle={this.state.mapStyle}
                onHover={this.onHover}
              />
              <Popup data={this.state.hoveredFeature} />
            </div>
            <LocateMe onClick={this._locateMe} />
            <ScrollToTop />
            <Switcher
              currentStyle={this.state.mapStyle}
              onChange={this.onMapStyleChange}
            />

            <ShareScreen
              post={this.state.post}
              open={this.state.share_screen}
              onClose={this.onShareScreenClose}
            />
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
          </Grid>
        </Grid>
      </div>
    );
  }

  onPublishClick = () => {
    const uri = `/p/${this.state.post.uuid}`;
    const { post } = this.state;
    if (post.title) document.title = post.title.substring(0, 80);
    restClient.createPost(post).then(uuid => {
      this.setState({ share_screen: true });
      this.props.history.replace(uri);
    });
  };

  onContentChange = content => {
    const title = content.document.nodes.first().getFirstText().text;
    const newPost = { ...this.state.post, content, title };
    this.setState({ post: newPost });
    if (title) {
        document.title = "Draft - " + title.substring(0, 120);
    }
  };

  onLocationUpdateHandler = (location, editor) => {
    computeGeojson(location, editor, this.updateStateFromGeojson);
  };

  updateStateFromGeojson = geojson => {
    if (geojson.features.length === 0) {
      this.setState({ geojson });
    } else {
      const { width, height } = this.getMapDivDimensions();
      const bbox = GeoHelper.bboxFromGeoJson(geojson);
      const newViewstate = Object.assign(
        this.state.viewstate,
        GeoHelper.bbox2Viewport(bbox, width, height)
      );
      this.setState({ geojson, viewstate: newViewstate });
    }
  };

  _locateMe = () => {
    GeoHelper.getLatLngFromIP().then(latlng => {
      this.setState({
        // myLocation: latlng,
        viewstate: { ...this.state.viewstate, ...latlng }
      });
    });
  };

  onHover = _.debounce((evt: IActiveFeature | null) => {
    this.setState({ hoveredFeature: evt });
  }, 100);
}

const RRApp = withRouter(App);
export default withStyles(styles)(RRApp);
