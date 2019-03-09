import * as React from "react";
import { Typography } from "@material-ui/core";
import { withStyles, createStyles, Theme } from "@material-ui/core/styles";

const styles = (theme: Theme) =>
  createStyles({
    root: {
        position: "relative",
      marginTop: theme.spacing.unit
    }
  });

export interface IAppProps {
  sideToolbar: any;
  classes?: any;
  attributes: any;
}

export interface IAppState {}

class Description extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);

    this.state = {};
  }

  public render() {
    const { children, classes, attributes, sideToolbar } = this.props;
    return (
      <div className={classes.root} {...attributes}>
        {sideToolbar}
        <Typography
          variant="h5"
          color="textPrimary"
          style={{
            fontWeight: 400,
            fontFamily: "Georgia,Cambria,Times New Roman,Times,serif"
          }}
        >
          {children}
        </Typography>
      </div>
    );
  }
}

export default withStyles(styles)(Description);
