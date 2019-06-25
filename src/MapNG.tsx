import * as React from "react";
import DeckGL, { MapController, GeoJsonLayer, MapView } from "deck.gl";
import { StaticMap } from "react-map-gl";
import { Hidden, withWidth } from "@material-ui/core";

import { makeIconLayer } from "./map/IconLayer";

//import Geocoder from "@mappandas/react-map-gl-geocoder";
import Geocoder from "react-map-gl-geocoder";

import * as _ from "underscore";

import * as Config from "./Config";
import PandaGL from "./PandaGL";
import { IActiveFeature } from "./types/CustomMapTypes";
import { FeatureCollection } from "geojson";

interface IProps {
  geojson?: FeatureCollection;
  mapStyle?: string;
  viewstate: any;
  onViewStateChanged: (any) => void;
  //onHover?: (data: IActiveFeature | null) => void;
  onPointHover?: Function;
  onPointClick?: Function;
  selectedFeature?: any;
  supportingLayers?: any;
}

interface IState {
  selectedFeatureIndexes: any[];
  mode: string;
  searchResultLayer: GeoJsonLayer;
}

class MapNG extends React.Component<IProps, IState> {
  private mapRef = React.createRef<StaticMap>();

  constructor(props: IProps) {
    super(props);
    this.state = {
      selectedFeatureIndexes: [0],
      mode: "drawPoint",
      searchResultLayer: null
    };
  }

  handleOnResult = event => {
    this.setState({
      searchResultLayer: new GeoJsonLayer({
        id: "search-result",
        data: event.result.geometry,
        getFillColor: [255, 0, 0, 128],
        getRadius: 1000,
        pointRadiusMinPixels: 10,
        pointRadiusMaxPixels: 10
      })
    });
  };

  // _onHover = (evt: any) => {
  //   if (this.props.onHover) {
  //     if (!evt) {
  //       this.props.onHover(null);
  //     } else {
  //       const { x, y, index, object } = evt;
  //       this.props.onHover({ x, y, index, object });
  //     }
  //   }
  // };

  render() {
    const { geojson, mapStyle, onPointHover, onPointClick, viewstate, selectedFeature, supportingLayers } = this.props;
    const layers =
      geojson && geojson.features && geojson.features.length > 0
        ? [makeIconLayer(geojson.features, onPointHover, onPointClick, selectedFeature)]
        : [];
    if (supportingLayers) {
      layers.push(supportingLayers);
    }
    if (this.state.searchResultLayer) {
      //layers.push(this.state.searchResultLayer);
    }

    return (
      <DeckGL
        initialViewState={viewstate}
        viewState={viewstate}
        layers={layers}
        controller={{
          type: MapController,
          dragRotate: false,
          doubleClickZoom: true
        }}
        onViewStateChange={this.props.onViewStateChanged}
      //onHover={this._onHover}
      >
        {/* <ResponsiveGeocoder
          className="geocoder-container"
          mapRef={this.mapRef}
          onResult={this.handleOnResult}
          onViewportChange={this.props.onViewStateChanged}
          mapboxApiAccessToken={Config.MAPBOX_TOKEN}
          position="top-left"
          divId="search-container"
          flyTo={false}
        /> */}
        <MapView id="map" width="100%" controller={true} >

          <StaticMap
            viewState={viewstate}
            reuseMaps
            mapStyle={`mapbox://styles/mapbox/${mapStyle ? mapStyle : "light-v9"}`}
            preventStyleDiffing={false}
            mapboxApiAccessToken={Config.MAPBOX_TOKEN}
          //ref={this.mapRef}
          />
        </MapView>
      </DeckGL>
    );
  }
}

const ResponsiveGeocoder = withWidth()((props: any) => (
  <Hidden mdDown>
    <Geocoder {...props} />
  </Hidden>
));

export default MapNG;
