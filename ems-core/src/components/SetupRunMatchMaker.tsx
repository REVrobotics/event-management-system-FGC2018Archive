import * as React from "react";
import {Button, Card, Form, RadioProps, Tab} from "semantic-ui-react";
import {getTheme} from "../shared/AppTheme";
import {SyntheticEvent} from "react";
import Schedule from "../shared/models/Schedule";
import MatchMakerManager from "../shared/managers/MatchMakerManager";
import Team from "../shared/models/Team";
import {ApplicationActions, IApplicationState} from "../stores";
import AppError from "../shared/models/AppError";
import DialogManager from "../shared/managers/DialogManager";
import {connect} from "react-redux";
import Event from "../shared/models/Event";
import {IDisableNavigation} from "../stores/internal/types";
import {Dispatch} from "redux";
import {disableNavigation} from "../stores/internal/actions";
import Match from "../shared/models/Match";
import ScheduleItem from "../shared/models/ScheduleItem";
import EMSProvider from "../shared/providers/EMSProvider";
import {AxiosResponse} from "axios";

interface IProps {
  teams: Team[],
  schedule: Schedule,
  onComplete: (matches: Match[]) => void,
  event?: Event,
  navigationDisabled?: boolean,
  setNavigationDisabled?: (disabled: boolean) => IDisableNavigation,
}

interface IState {
  matchMakerQuality: string,
  scheduleItems: ScheduleItem[],
  requestingData: boolean
}

class SetupRunMatchMaker extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      matchMakerQuality: "-b",
      scheduleItems: [],
      requestingData: true
    };
    this.onQualityChange = this.onQualityChange.bind(this);
    this.runMatchMaker = this.runMatchMaker.bind(this);
  }

  public componentDidMount() {
    EMSProvider.getScheduleItems(this.props.schedule.type).then((response: AxiosResponse) => {
      const items: ScheduleItem[] = [];
      if (response.data.payload && response.data.payload.length > 0) {
        for (const item of response.data.payload) {
          items.push(new ScheduleItem(this.props.schedule.type).fromJSON(item));
        }
      }
      this.setState({scheduleItems: items, requestingData: false});
    }).catch(() => {
      this.setState({requestingData: false});
    });
  }

  public render() {
    const {matchMakerQuality, scheduleItems, requestingData} = this.state;
    return (
      <Tab.Pane className="step-view-tab">
        <Card fluid={true} color={getTheme().secondary}>
          <Card.Content>
            <Card.Header>Match Maker Parameters</Card.Header>
          </Card.Content>
          <Card.Content>
            <Form>
              <Form.Field>
                <b>Match Maker Quality Options</b>
              </Form.Field>
              <Form.Radio value="-f" label="Fair Quality" name="mmOptions" checked={matchMakerQuality === "-f"} onChange={this.onQualityChange}/>
              <Form.Radio value="-g" label="Good Quality" name="mmOptions" checked={matchMakerQuality === "-g"} onChange={this.onQualityChange} />
              <Form.Radio value="-b" label="Best Quality (Recommended)" name="mmOptions" checked={matchMakerQuality === "-b"} onChange={this.onQualityChange}/>
              <Form.Field>
                <Button color={getTheme().primary} disabled={this.props.navigationDisabled || scheduleItems.length === 0} loading={this.props.navigationDisabled} onClick={this.runMatchMaker}>Run Match Maker</Button>
                {
                  scheduleItems.length === 0 && !requestingData &&
                  <span className="error-text"><i>There is currently no generated {this.props.schedule.type.toString().toLowerCase()} schedule. Head over to the 'Schedule Parameters' tab to generate one.</i></span>
                }
              </Form.Field>
            </Form>
          </Card.Content>
        </Card>
      </Tab.Pane>
    );
  }

  private onQualityChange(event: SyntheticEvent, props: RadioProps) {
    this.setState({matchMakerQuality: props.value.toString()});
  }

  private runMatchMaker() {
    this.props.setNavigationDisabled(true);
    MatchMakerManager.createTeamList(this.props.teams).then(() => {
      MatchMakerManager.execute({
        teams: this.props.schedule.teamsParticipating,
        rounds: this.props.schedule.matchesPerTeam,
        quality: this.state.matchMakerQuality,
        teamsPerAlliance: this.props.schedule.teamsPerAlliance,
        fields: this.props.event.fieldCount,
        eventKey: this.props.event.eventKey,
        type: this.props.schedule.type
      }).then((matches: Match[]) => {
        let matchNumber: number = 0;
        for (const item of this.state.scheduleItems) { // This is assuming scheduleItems and matchList have the same lengths...
          if (item.isMatch) {
            matches[matchNumber].scheduledStartTime = item.startTime;
            matchNumber++;
          }
        }
        this.props.setNavigationDisabled(false);
        this.props.onComplete(matches);
      }).catch((error: AppError) => {
        this.props.setNavigationDisabled(false);
        DialogManager.showErrorBox(error);
      });
    }).catch((error: AppError) => {
      this.props.setNavigationDisabled(false);
      DialogManager.showErrorBox(error);
    });
  }
}

export function mapStateToProps({internalState, configState}: IApplicationState) {
  return {
    event: configState.event,
    navigationDisabled: internalState.navigationDisabled
  };
}

export function mapDispatchToProps(dispatch: Dispatch<ApplicationActions>) {
  return {
    setNavigationDisabled: (disabled: boolean) => dispatch(disableNavigation(disabled)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SetupRunMatchMaker);