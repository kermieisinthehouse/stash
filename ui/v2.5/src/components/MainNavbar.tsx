import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
  useIntl,
} from "react-intl";
import { Nav, Navbar, Button, Fade } from "react-bootstrap";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { LinkContainer } from "react-router-bootstrap";
import { Link, NavLink, useLocation, useHistory } from "react-router-dom";
import Mousetrap from "mousetrap";

import { SessionUtils } from "src/utils";
import { Icon } from "src/components/Shared";
import { ConfigurationContext } from "src/hooks/Config";
import { Manual } from "./Help/Manual";

interface IMenuItem {
  name: string;
  message: MessageDescriptor;
  href: string;
  icon: IconName;
  hotkey: string;
  userCreatable?: boolean;
}

const messages = defineMessages({
  scenes: {
    id: "scenes",
    defaultMessage: "Scenes",
  },
  images: {
    id: "images",
    defaultMessage: "Images",
  },
  movies: {
    id: "movies",
    defaultMessage: "Movies",
  },
  markers: {
    id: "markers",
    defaultMessage: "Markers",
  },
  performers: {
    id: "performers",
    defaultMessage: "Performers",
  },
  studios: {
    id: "studios",
    defaultMessage: "Studios",
  },
  tags: {
    id: "tags",
    defaultMessage: "Tags",
  },
  galleries: {
    id: "galleries",
    defaultMessage: "Galleries",
  },
  sceneTagger: {
    id: "sceneTagger",
    defaultMessage: "Scene Tagger",
  },
  donate: {
    id: "donate",
    defaultMessage: "Donate",
  },
});

const allMenuItems: IMenuItem[] = [
  {
    name: "scenes",
    message: messages.scenes,
    href: "/scenes",
    icon: "play-circle",
    hotkey: "g s",
  },
  {
    name: "images",
    message: messages.images,
    href: "/images",
    icon: "image",
    hotkey: "g i",
  },
  {
    name: "movies",
    message: messages.movies,
    href: "/movies",
    icon: "film",
    hotkey: "g v",
    userCreatable: true,
  },
  {
    name: "markers",
    message: messages.markers,
    href: "/scenes/markers",
    icon: "map-marker-alt",
    hotkey: "g k",
  },
  {
    name: "galleries",
    message: messages.galleries,
    href: "/galleries",
    icon: "images",
    hotkey: "g l",
    userCreatable: true,
  },
  {
    name: "performers",
    message: messages.performers,
    href: "/performers",
    icon: "user",
    hotkey: "g p",
    userCreatable: true,
  },
  {
    name: "studios",
    message: messages.studios,
    href: "/studios",
    icon: "video",
    hotkey: "g u",
    userCreatable: true,
  },
  {
    name: "tags",
    message: messages.tags,
    href: "/tags",
    icon: "tag",
    hotkey: "g t",
    userCreatable: true,
  },
];

const newPathsList = allMenuItems
  .filter((item) => item.userCreatable)
  .map((item) => item.href);

export const MainNavbar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { configuration, loading } = React.useContext(ConfigurationContext);

  // Show all menu items by default, unless config says otherwise
  const [menuItems, setMenuItems] = useState<IMenuItem[]>(allMenuItems);

  const [expanded, setExpanded] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const iCfg = configuration?.interface;
    if (iCfg?.menuItems) {
      setMenuItems(
        allMenuItems.filter((menuItem) =>
          iCfg.menuItems!.includes(menuItem.name)
        )
      );
    }
  }, [configuration]);

  // react-bootstrap typing bug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navbarRef = useRef<any>();
  const intl = useIntl();

  const maybeCollapse = useCallback(
    (event: Event) => {
      if (
        navbarRef.current &&
        event.target instanceof Node &&
        !navbarRef.current.contains(event.target)
      ) {
        setExpanded(false);
      }
    },
    [setExpanded]
  );

  useEffect(() => {
    if (expanded) {
      document.addEventListener("click", maybeCollapse);
      document.addEventListener("touchstart", maybeCollapse);
    }
    return () => {
      document.removeEventListener("click", maybeCollapse);
      document.removeEventListener("touchstart", maybeCollapse);
    };
  }, [expanded, maybeCollapse]);

  const goto = useCallback(
    (page: string) => {
      history.push(page);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [history]
  );

  const { pathname } = location;
  const newPath = newPathsList.includes(pathname) ? `${pathname}/new` : null;

  // set up hotkeys
  useEffect(() => {
    Mousetrap.bind("?", () => setShowManual(!showManual));
    Mousetrap.bind("g z", () => goto("/settings"));

    menuItems.forEach((item) =>
      Mousetrap.bind(item.hotkey, () => goto(item.href))
    );

    if (newPath) {
      Mousetrap.bind("n", () => history.push(newPath));
    }

    return () => {
      Mousetrap.unbind("?");
      Mousetrap.unbind("g z");
      menuItems.forEach((item) => Mousetrap.unbind(item.hotkey));

      if (newPath) {
        Mousetrap.unbind("n");
      }
    };
  });

  function maybeRenderLogout() {
    if (SessionUtils.isLoggedIn()) {
      return (
        <Button
          className="minimal logout-button d-flex align-items-center"
          href="/logout"
          title="Log out"
        >
          <Icon icon="sign-out-alt" />
        </Button>
      );
    }
  }

  const handleDismiss = useCallback(() => setExpanded(false), [setExpanded]);

  return (
    <>
      <Manual show={showManual} onClose={() => setShowManual(false)} />
      <Navbar
        collapseOnSelect
        fixed="top"
        variant="dark"
        bg="dark"
        className="top-nav justify-content-start"
        expand="xl"
        expanded={expanded}
        onToggle={setExpanded}
        ref={navbarRef}
      >
        <Navbar.Brand as="div" onClick={handleDismiss}>
          <Link to="/">
            <Button className="minimal brand-link d-inline-block">Stash</Button>
          </Link>
        </Navbar.Brand>

        <Nav className="navbar-buttons flex-row ml-auto order-xl-1">
          {!!newPath && (
            <div className="mr-2">
              <Link to={newPath}>
                <Button variant="primary">
                  <FormattedMessage id="new" defaultMessage="New" />
                </Button>
              </Link>
            </div>
          )}
          <Nav.Link
            href="https://opencollective.com/stashapp"
            target="_blank"
            onClick={handleDismiss}
          >
            <Button
              className="minimal donate d-flex align-items-center h-100"
              title="Donate"
            >
              <Icon icon="heart" />
              <span>{intl.formatMessage(messages.donate)}</span>
            </Button>
          </Nav.Link>
          <NavLink exact to="/settings" onClick={handleDismiss}>
            <Button
              className="minimal d-flex align-items-center h-100"
              title="Settings"
            >
              <Icon icon="cog" />
            </Button>
          </NavLink>
          <Button
            className="minimal help-button d-flex align-items-center"
            onClick={() => setShowManual(true)}
            title="Help"
          >
            <Icon icon="question-circle" />
          </Button>
          {maybeRenderLogout()}
          <Navbar.Toggle className="nav-menu-toggle ml-sm-2" />
        </Nav>

        <Navbar.Collapse className="bg-dark">
          <Fade in={!loading}>
            <Nav className="mr-md-auto flex-row flex-wrap flex-xl-nowrap justify-content-center pb-2 pb-xl-0">
              {menuItems.map(({ href, icon, message }) => (
                <Nav.Link
                  eventKey={href}
                  as="div"
                  key={href}
                  className="col-4 col-sm-3 col-md-2 col-lg-auto"
                >
                  <LinkContainer activeClassName="active" exact to={href}>
                    <Button className="minimal p-4 p-xl-2 d-flex d-xl-inline-block flex-column justify-content-between align-items-center">
                      <Icon
                        {...{ icon }}
                        className="nav-menu-icon d-block d-xl-inline mb-2 mb-xl-0"
                      />
                      <span>{intl.formatMessage(message)}</span>
                    </Button>
                  </LinkContainer>
                </Nav.Link>
              ))}
            </Nav>
          </Fade>
        </Navbar.Collapse>
      </Navbar>
    </>
  );
};
