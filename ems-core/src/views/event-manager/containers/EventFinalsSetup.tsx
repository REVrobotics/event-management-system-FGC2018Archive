import * as React from "react";
import {Tab, TabProps} from "semantic-ui-react";
import {SyntheticEvent} from "react";
import {ApplicationActions, IApplicationState} from "../../../stores";
import SetupRankingsOverview from "../../../components/SetupRankingsOverview";
import Event from "../../../shared/models/Event";
import EventConfiguration from "../../../shared/models/EventConfiguration";
import Team from "../../../shared/models/Team";
import Schedule from "../../../shared/models/Schedule";
import SetupScheduleParams from "../../../components/SetupScheduleParams";
import ScheduleItem from "../../../shared/models/ScheduleItem";
import EventPostingController from "../controllers/EventPostingController";
import HttpError from "../../../shared/models/HttpError";
import DialogManager from "../../../shared/managers/DialogManager";
import {IDisableNavigation, ISetFinalsMatches} from "../../../stores/internal/types";
import {Dispatch} from "redux";
import {disableNavigation, setFinalsMatches} from "../../../stores/internal/actions";
import {connect} from "react-redux";
import SetupScheduleOverview from "../../../components/SetupScheduleOverview";
import SetupRunMatchMaker from "../../../components/SetupRunMatchMaker";
import Match from "../../../shared/models/Match";
import SetupMatchScheduleOverview from "../../../components/SetupMatchScheduleOverview";

interface IProps {
  onComplete: () => void,
  navigationDisabled?: boolean,
  event?: Event,
  eventConfig?: EventConfiguration,
  teamList?: Team[],
  schedule?: Schedule,
  finalsMatches?: Match[],
  setNavigationDisabled?: (disabled?: boolean) => IDisableNavigation,
  setFinalsMatches: (matches: Match[]) => ISetFinalsMatches
}

interface IState {
  activeIndex: number,
  qualifiedTeams: Team[]
}

class EventFinalsSetup extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      activeIndex: 0,
      qualifiedTeams: []
    };
    this.onTabChange = this.onTabChange.bind(this);
    this.onParamsComplete = this.onParamsComplete.bind(this);
    this.onMatchMakerComplete = this.onMatchMakerComplete.bind(this);
    this.onPublishSchedule = this.onPublishSchedule.bind(this);
  }

  public componentDidMount() {
    this.props.schedule.teamsPerAlliance = this.props.eventConfig.postQualTeamsPerAlliance;
    this.props.schedule.teamsParticipating = this.props.eventConfig.rankingCutoff;
    this.setState({qualifiedTeams: this.props.teamList.slice(0, this.props.eventConfig.rankingCutoff)});
    this.forceUpdate();
  }

  public render() {
    return (
      <div className="step-view no-overflow">
        <Tab menu={{secondary: true}} activeIndex={this.state.activeIndex} onTabChange={this.onTabChange} panes={[
          { menuItem: "Finals Participants", render: () => <SetupRankingsOverview/>},
          { menuItem: "Schedule Parameters", render: () => <SetupScheduleParams schedule={this.props.schedule} teams={this.state.qualifiedTeams} onComplete={this.onParamsComplete}/>},
          { menuItem: "Schedule Overview", render: () => <SetupScheduleOverview type={"Finals"}/>},
          { menuItem: "Match Maker Parameters", render: () => <SetupRunMatchMaker schedule={this.props.schedule} teams={this.state.qualifiedTeams} onComplete={this.onMatchMakerComplete}/>},
          { menuItem: "Match Schedule Overview", render: () => <SetupMatchScheduleOverview type="Finals" matchList={this.props.finalsMatches} onComplete={this.onPublishSchedule}/>},
        ]}
        />
      </div>
    );
  }

  private onTabChange(event: SyntheticEvent, props: TabProps) {
    if (!this.props.navigationDisabled && typeof this.props.eventConfig.rankingCutoff !== "undefined") {
      this.setState({activeIndex: parseInt(props.activeIndex as string, 10)});
    }
  }

  private onParamsComplete(scheduleItems: ScheduleItem[]) {
    this.props.setNavigationDisabled(true);
    EventPostingController.createSchedule("Finals", scheduleItems).then(() => {
      this.props.setNavigationDisabled(false);
      this.setState({activeIndex: 2});
    }).catch((error: HttpError) => {
      this.props.setNavigationDisabled(false);
      DialogManager.showErrorBox(error);
    });
  }

  private onMatchMakerComplete(matches: Match[]) {
    this.props.setFinalsMatches(matches);
    this.setState({activeIndex: 4});
  }

  private onPublishSchedule() {
    this.props.setNavigationDisabled(true);
    EventPostingController.deleteRanks().then(() => {
      EventPostingController.createMatchSchedule(6, this.props.finalsMatches).then(() => {
        EventPostingController.createRanks(this.state.qualifiedTeams, this.props.event.eventKey).then(() => {
          this.props.setNavigationDisabled(false);
          this.props.onComplete();
        }).catch((rankError: HttpError) => {
          this.props.setNavigationDisabled(false);
          DialogManager.showErrorBox(rankError);
        });
      }).catch((schedError: HttpError) => {
        this.props.setNavigationDisabled(false);
        DialogManager.showErrorBox(schedError);
      });
    }).catch((error: HttpError) => {
      this.props.setNavigationDisabled(false);
      DialogManager.showErrorBox(error);
    });
  }

}

export function mapStateToProps({internalState, configState}: IApplicationState) {
  return {
    navigationDisabled: internalState.navigationDisabled,
    teamList: internalState.teamList,
    eventConfig: configState.eventConfiguration,
    event: configState.event,
    schedule: configState.finalsSchedule,
    finalsMatches: internalState.finalsMatches
  };
}

export function mapDispatchToProps(dispatch: Dispatch<ApplicationActions>) {
  return {
    setNavigationDisabled: (disabled: boolean) => dispatch(disableNavigation(disabled)),
    setFinalsMatches: (matches: Match[]) => dispatch(setFinalsMatches(matches))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventFinalsSetup);