import * as React from "react";
import { Editor } from "slate-react";
import { Range } from "slate";
import * as _ from "underscore";
import { linkifyPlugin } from "@mercuriya/slate-linkify";

import schema from "./schema";

import placeholderPlugins from "./placeholders";

import onEnter from "./onEnter";
import onDash from "./onDash";
import onBackspace from "./onBackspace";
import * as ToolbarHandler from "./handlers/toolbarHander";
import SideToolbar from "./SideToolbar";
import { LocationPlugin } from "./plugins";
import FloatingToolbar from "./FloatingToolbar";
import {
  Title,
  Overview,
  Entry,
  Location,
  Description,
  Image,
  Caption,
  Figure,
  Link
} from "./slate-views";

export interface IAppProps {
  uuid: string;
  content: any;
  readonly: boolean;
  onLocationUpdate: (location, editor) => void;
  onContentChange: (content) => void;
}

export interface IAppState {
  plugins: any;
  toolbarProps: any;
}

const KEY_ENTER = "Enter";
const KEY_DASH = "=";
const KEY_BACKSPACE = "Backspace";

class SmartEditor extends React.Component<IAppProps, IAppState> {
  private timer: any;
  private editorRef: any;
  private toolbarHandler: any;
  private floatingToolbarRef: any;

  constructor(props: IAppProps) {
    super(props);

    const locationPlugin = LocationPlugin({
      handler: this.props.onLocationUpdate
    });
    this.state = {
      toolbarProps: {
        top: -10000,
        left: -10000,
        visible: false
      },
      plugins: [
        locationPlugin,
        placeholderPlugins,
        linkifyPlugin({
          wrapCommand: "wrapLink"
          //   renderComponent: args => {
          //     console.log("#arg", args);
          //     return <div>foo</div>;
          //   }
        })
        // {
        //   commands: {
        //     wrapLink(editor, href) {
        //       console.log("#wraping link", href);
        //       editor.wrapInline({
        //         type: "link",
        //         data: { href }
        //       });

        //       editor.moveToEnd();
        //     }
        //   }
        // }
      ]
    };

    this.editorRef = React.createRef();
    this.floatingToolbarRef = React.createRef();
  }

  setRef = ref => {
    this.editorRef = ref;
    if (!ref) return;
    this.toolbarHandler = ToolbarHandler.create(
      this.props.uuid,
      this.props.onLocationUpdate,
      this.editorRef
    );
  };

  onKeyDown = (event, editor, next) => {
    const args = { event, editor, next };
    switch (event.key) {
      case KEY_ENTER:
        return onEnter(args);
      case KEY_DASH:
        return onDash(event, editor, next);
      case KEY_BACKSPACE:
        return onBackspace(event, editor, next);
    }
    return next();
  };

  _printNode = (nodes, depth) => {
    if (nodes) {
      const newDepth = depth + 2;
      const padding = new Array(depth + 1).join(" ");
      nodes.forEach(node => {
        if (node.object === "text") {
          const text = node.text ? node.text : "<empty>";
          console.log(padding, text);
          console.log(padding, node.toJSON({ preserveKeys: true }));

          return;
        }
        console.log(padding, node.toJSON({ preserveKeys: true }));

        if (node.object !== "text") this._printNode(node.nodes, newDepth);
        else this._printNode(node.leaves, newDepth);
      });
    }
  };

  onChange = ({ value }) => {
    if (this.props.readonly) return;
    //console.log("#onChange()", value.toJS());

    this.props.onContentChange(value);
    this.updateFloatingMenu();
  };

  printDebug = (e: any) => {
    const document = this.editorRef.value
      ? this.editorRef.value.document
      : undefined;
    if (document) {
      console.log(" ========= Document nodes =========");
      console.log(document.toJSON({ preserveKeys: true }));
      document.nodes.forEach(node => {
        console.log("---");
        console.log(node.toJSON({ preserveKeys: true }));
        this._printNode(node.nodes, 3);
      });
    }
  };

  printSelection = (e: any) => {
    const selection = this.editorRef.value
      ? this.editorRef.value.selection
      : undefined;
    if (selection) {
      console.log(" ");
      console.log(" ========= Document nodes =========");
      console.log("   ", selection.toJSON());
    }
  };

  componentDidMount() {
    this.timer = setInterval(this.saveDraft, 12000);
  }

  //   shouldComponentUpdate(nextProps: IAppProps, nextState: IAppState) {
  //     const { uuid, readonly, content } = this.props;
  //     return (
  //       uuid !== nextProps.uuid ||
  //       readonly !== nextProps.readonly ||
  //       content !== nextProps.content
  //     );
  //   }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidUpdate = () => {};

  public render() {
    if (!this.props.content) return null;
    return (
      // <button onClick={this.printSelection}>Selection</button>

      //<button onClick={this.printDebug}>Document</button>
      <Editor
        ref={this.setRef}
        readOnly={this.props.readonly}
        autoFocus={true}
        value={this.props.content}
        schema={schema}
        plugins={this.state.plugins}
        renderEditor={this.renderEditor}
        renderNode={this.renderNode}
        renderMark={this.renderMark}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
      />
    );
  }

  renderEditor = (props, editor, next) => {
    const children = next();
    return (
      <React.Fragment>
        {children}
        <FloatingToolbar
          editor={editor}
          toolbarProps={this.state.toolbarProps}
        />
      </React.Fragment>
    );
  };

  renderNode = (props, editor, next) => {
    const { attributes, children, node, isFocused } = props;
    const sideToolbar = !this.props.readonly && (
      <SideToolbar
        key={attributes["data-key"]}
        editor={editor}
        dataKey={attributes["data-key"]}
        handlers={this.toolbarHandler}
      />
    );
    switch (node.type) {
      case "title":
        return (
          <Title
            attributes={attributes}
            children={children}
            sideToolbar={sideToolbar}
          />
        );
      case "overview":
        return (
          <Overview
            attributes={attributes}
            node={node}
            editor={editor}
            children={children}
            sideToolbar={sideToolbar}
          />
        );
      case "description":
        return (
          <Description
            attributes={attributes}
            children={children}
            sideToolbar={sideToolbar}
          />
        );
      case "card":
        return (
          <Entry
            attributes={attributes}
            children={children}
            handlers={this.toolbarHandler}
            editor={this.editorRef}
            readonly={this.props.readonly}
          />
        );
      case "location":
        return <Location attributes={attributes} children={children} />;
      case "image": {
        const url = node.data.get("url");
        const src = url ? url : node.data.get("src");
        return (
          <Image
            src={src}
            isSelected={isFocused}
            attributes={attributes}
            children={children}
            readonly={this.props.readonly}
          />
        );
      }
      case "figure":
        return <Figure attributes={attributes} children={children} />;

      case "caption":
        return <Caption attributes={attributes} children={children} />;

      case "link":
        if (!node || node.text === "") return next();
        return <Link attributes={attributes} children={children} node={node} />;

      default:
        return next();
    }
  };

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props;
    console.log("rendermark()", mark.toJS(), children)
    switch (mark.type) {
      case "highlight":
        return (
          <span {...attributes} style={{ backgroundColor: "#ffeeba" }}>
            {children}
          </span>
        );
      case "bold":
        return <strong {...attributes}>{children}</strong>;
        case 'italic':
        return <em {...attributes}>{children}</em>
      default:
        return next();
    }
  };

  updateFloatingMenu = () => {
    const { content } = this.props;
    const { fragment, selection } = content;

    if (selection.isBlurred || selection.isCollapsed || fragment.text === "") {
      this.setState({ toolbarProps: { visible: false } });
      return;
    }

    const native = window.getSelection();
    const range = native.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const toolbarProps = {
      visible: true,
      rect: range.getBoundingClientRect()
    };
    this.setState({ toolbarProps });
  };

  saveDraft = () => {
    // no op at the moment
  };
}

export default SmartEditor;
