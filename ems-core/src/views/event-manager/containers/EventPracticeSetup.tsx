import * as React from "react";
import {SyntheticEvent} from "react";
import {Tab, TabProps} from "semantic-ui-react";
import {ApplicationActions, IApplicationState} from "../../../stores";
import {connect} from "react-redux";
import SetupScheduleParams from "../../../components/SetupScheduleParams";
import SetupScheduleOverview from "../../../components/SetupScheduleOverview";
import SetupRunMatchMaker from "../../../components/SetupRunMatchMaker";
import SetupMatchScheduleOverview from "../../../components/SetupMatchScheduleOverview";
import Schedule from "../../../shared/models/Schedule";
import Team from "../../../shared/models/Team";
import EventConfiguration from "../../../shared/models/EventConfiguration";
import ScheduleItem from "../../../shared/models/ScheduleItem";
import {IDisableNavigation, ISetPracticeMatches} from "../../../stores/internal/types";
import {Dispatch} from "redux";
import {disableNavigation, setPracticeMatches} from "../../../stores/internal/actions";
import EventPostingController from "../controllers/EventPostingController";
import HttpError from "../../../shared/models/HttpError";
import DialogManager from "../../../shared/managers/DialogManager";
import Match from "../../../shared/models/Match";

interface IProps {
  onComplete: () => void,
  navigationDisabled?: boolean,
  eventConfig?: EventConfiguration,
  teamList?: Team[],
  schedule?: Schedule,
  practiceMatches?: Match[],
  setNavigationDisabled?: (disabled?: boolean) => IDisableNavigation,
  setPracticeMatches?: (matches: Match[]) => ISetPracticeMatches
}

interface IState {
  activeIndex: number,
}

class EventPracticeSetup extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      activeIndex: 0
    };
    this.onTabChange = this.onTabChange.bind(this);
    this.onParamsComplete = this.onParamsComplete.bind(this);
    this.onMatchMakerComplete = this.onMatchMakerComplete.bind(this);
    this.onPublishSchedule = this.onPublishSchedule.bind(this);
  }

  public componentDidMount() {
    this.props.schedule.teamsPerAlliance = this.props.eventConfig.teamsPerAlliance;
    this.props.schedule.teamsParticipating = this.props.teamList.length;
    this.forceUpdate();
  }

  public componentDidUpdate(prevProps: IProps) {
    if (prevProps.teamList.length !== this.props.teamList.length) {
      this.props.schedule.teamsParticipating = this.props.teamList.length;
      this.forceUpdate();
    }
  }

  public render() {
    return (
      <div className="step-view no-overflow">
        <Tab menu={{secondary: true}} activeIndex={this.state.activeIndex} onTabChange={this.onTabChange} panes={[
          { menuItem: "Schedule Parameters", render: () => <SetupScheduleParams schedule={this.props.schedule} teams={this.props.teamList} onComplete={this.onParamsComplete}/>},
          { menuItem: "Schedule Overview", render: () => <SetupScheduleOverview type={"Practice"}/>},
          { menuItem: "Match Maker Parameters", render: () => <SetupRunMatchMaker schedule={this.props.schedule} teams={this.props.teamList} onComplete={this.onMatchMakerComplete}/>},
          { menuItem: "Match Schedule Overview", render: () => <SetupMatchScheduleOverview type="Practice" matchList={this.props.practiceMatches} onComplete={this.onPublishSchedule}/>},
        ]}
        />
      </div>
    );
  }

  private onTabChange(event: SyntheticEvent, props: TabProps) {
    if (!this.props.navigationDisabled) {
      this.setState({activeIndex: parseInt(props.activeIndex as string, 10)});
    }
  }

  private onParamsComplete(scheduleItems: ScheduleItem[]) {
    this.props.setNavigationDisabled(true);
    EventPostingController.createSchedule("Practice", scheduleItems).then(() => {
      this.props.setNavigationDisabled(false);
      this.setState({activeIndex: 1});
    }).catch((error: HttpError) => {
      this.props.setNavigationDisabled(false);
      DialogManager.showErrorBox(error);
    });
  }

  private onMatchMakerComplete(matches: Match[]) {
    this.props.setPracticeMatches(matches);
    this.setState({activeIndex: 3});
  }

  private onPublishSchedule() {
    this.props.setNavigationDisabled(true);
    EventPostingController.createMatchSchedule(0, this.props.practiceMatches).then(() => {
      this.props.setNavigationDisabled(false);
      this.props.onComplete();
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
    schedule: configState.practiceSchedule,
    practiceMatches: internalState.practiceMatches
  };
}

export function mapDispatchToProps(dispatch: Dispatch<ApplicationActions>) {
  return {
    setNavigationDisabled: (disabled: boolean) => dispatch(disableNavigation(disabled)),
    setPracticeMatches: (matches: Match[]) => dispatch(setPracticeMatches(matches))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventPracticeSetup);