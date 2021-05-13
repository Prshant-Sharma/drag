import React, { Component } from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}
class SnackBarComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      open: this.props.open,
    };
  }
  componentWillReceiveProps(nextProps) {
    this.setState({ open: nextProps.open });
  }
  handleClose = () => {
    this.setState((prevState) => {
      return {
        open: !prevState.open,
      };
    });
  };
  render() {
    return (
      <Snackbar
        open={this.state.open}
        autoHideDuration={this.props.timer?this.props.timer:6000}
        onClose={this.props.handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        className={this.props.className?this.props.className:""}
      >
        <Alert onClose={this.props.handleClose} severity={this.props.severity}>
          {this.props.alertmsg}
        </Alert>
      </Snackbar>
    );
  }
}

export default SnackBarComponent;
