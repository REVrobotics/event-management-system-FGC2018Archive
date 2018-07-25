import * as React from "react";
import {SyntheticEvent} from "react";
import {Button, Card, Divider, DropdownProps, Form, Grid, Tab} from "semantic-ui-react";
import Match from "../../../shared/models/Match";
import {ApplicationActions, IApplicationState} from "../../../stores";
import {connect} from "react-redux";
import EventConfiguration from "../../../shared/models/EventConfiguration";
import {PostQualConfig, TournamentLevels} from "../../../shared/AppTypes";
import MatchConfiguration from "../../../shared/models/MatchConfiguration";
import MatchPlayTimerConfiguration from "../../../components/MatchPlayTimerConfiguration";
import {MatchState} from "../../../shared/models/MatchState";
import {ISetMatchState} from "../../../stores/scoring/types";
import {Dispatch} from "redux";
import {setMatchState} from "../../../stores/scoring/actions";
import MatchFlowController from "../controllers/MatchFlowController";

interface IProps {
  eventConfig?: EventConfiguration,
  matchConfig?: MatchConfiguration,
  matchState?: MatchState,
  practiceMatches: Match[],
  qualificationMatches: Match[],
  setMatchState?: (matchState: MatchState) => ISetMatchState
}

interface IState {
  selectedLevel: TournamentLevels,
  selectedMatch: string
  selectedField: number,
  configModalOpen: boolean,
  hasPrestarted: boolean
}

class MatchPlay extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      selectedLevel: "Practice",
      selectedMatch: "",
      selectedField: 1,
      configModalOpen: false,
      hasPrestarted: false,
    };
    this.changeSelectedLevel = this.changeSelectedLevel.bind(this);
    this.changeSelectedMatch = this.changeSelectedMatch.bind(this);
    this.changeSelectedField = this.changeSelectedField.bind(this);

    this.cancelPrestart = this.cancelPrestart.bind(this);
    this.prestart = this.prestart.bind(this);
    this.setAudienceDisplay = this.setAudienceDisplay.bind(this);
    this.startMatch = this.startMatch.bind(this);
    this.abortMatch = this.abortMatch.bind(this);
    this.commitScores = this.commitScores.bind(this);
  }

  public render() {
    const {selectedLevel, selectedMatch, selectedField, hasPrestarted} = this.state;
    const {eventConfig, matchState} = this.props;
    const fieldControl: number[] = (typeof eventConfig.fieldsControlled === "undefined" ? [1] : eventConfig.fieldsControlled);

    const availableLevels = this.getAvailableTournamentLevels(eventConfig.postQualConfig).map(tournamentLevel => {
      return {
        text: tournamentLevel,
        value: tournamentLevel
      };
    });

    const availableMatches = this.getMatchesByTournamentLevel(selectedLevel).map(match => {
      return {
        text: match.matchName,
        value: match.matchKey
      };
    });

    const availableFields = fieldControl.map(fieldNumber => {
      return {
        text: "Field " + fieldNumber,
        value: fieldNumber
      };
    });

    const disabledStates = MatchFlowController.getDisabledStates(this.props.matchState);
    const canPrestart = selectedMatch.length > 0 && selectedField > 0;

    return (
      <Tab.Pane className="tab-subview">
        <Grid columns="equal">
          <Grid.Row>
            <Grid.Column textAlign="left"><b>Match Status: </b>{matchState}</Grid.Column>
            <Grid.Column textAlign="center"><b>02:30 </b>(TELEOP)</Grid.Column>
            <Grid.Column textAlign="right"><b>Connection Status: </b>OKAY</Grid.Column>
          </Grid.Row>
        </Grid>
        <Divider/>
        <Grid columns={16} centered={true}>
          <Grid.Row>
            {
              hasPrestarted &&
              <Grid.Column width={3}><Button fluid={true} disabled={disabledStates[0]} color="red" onClick={this.cancelPrestart}>Cancel Prestart</Button></Grid.Column>
            }
            {
              !hasPrestarted &&
              <Grid.Column width={3}><Button fluid={true} disabled={disabledStates[0] || !canPrestart} color="orange" onClick={this.prestart}>Prestart</Button></Grid.Column>
            }
            <Grid.Column width={3}><Button fluid={true} disabled={disabledStates[1]} color="blue" onClick={this.setAudienceDisplay}>Set Audience Display</Button></Grid.Column>
            <Grid.Column width={3}><Button fluid={true} disabled={disabledStates[2]} color="yellow" onClick={this.startMatch}>Start Match</Button></Grid.Column>
            <Grid.Column width={3}><Button fluid={true} disabled={disabledStates[3]} color="red" onClick={this.abortMatch}>Abort Match</Button></Grid.Column>
            <Grid.Column width={3}><Button fluid={true} disabled={disabledStates[4]} color="green" onClick={this.commitScores}>Commit Scores</Button></Grid.Column>
          </Grid.Row>
        </Grid>
        <Divider/>
        <Card.Group itemsPerRow={3}>
          <Card fluid={true}>
            <Card.Content className="center-items card-header"><Card.Header>Match Configuration</Card.Header></Card.Content>
            <Card.Content>
              <Form>
                <Grid columns={16}>
                  <Grid.Row>
                    <Grid.Column computer={16} largeScreen={8} widescreen={6}><Form.Dropdown fluid={true} selection={true} value={selectedLevel} options={availableLevels} onChange={this.changeSelectedLevel} label="Tournament Level"/></Grid.Column>
                    <Grid.Column computer={16} largeScreen={8} widescreen={6}><Form.Dropdown fluid={true} selection={true} value={selectedMatch} options={availableMatches} onChange={this.changeSelectedMatch} label="Match"/></Grid.Column>
                    <Grid.Column computer={16} largeScreen={6} widescreen={4}><Form.Dropdown fluid={true} selection={true} value={selectedField} options={availableFields} onChange={this.changeSelectedField} label="Field"/></Grid.Column>
                  </Grid.Row>
                  <Divider/>
                </Grid>
                <MatchPlayTimerConfiguration/>
              </Form>
            </Card.Content>
          </Card>
          <Card fluid={true}>
            <Card.Content className="center-items card-header"><Card.Header>Red Alliance Scorecard</Card.Header></Card.Content>
            <Card.Content>
              Stuff
            </Card.Content>
          </Card>
          <Card fluid={true}>
            <Card.Content className="center-items card-header"><Card.Header>Blue Alliance Scorecard</Card.Header></Card.Content>
            <Card.Content>
              Stuff
            </Card.Content>
          </Card>
        </Card.Group>
      </Tab.Pane>
    );
  }

  private cancelPrestart() {
    this.setState({hasPrestarted: false});
    this.props.setMatchState(MatchState.PRESTART_READY);
  }

  private prestart() {
    this.props.setMatchState(MatchState.PRESTART_IN_PROGRESS);
    MatchFlowController.prestart().then(() => {
      this.setState({hasPrestarted: true});
      this.props.setMatchState(MatchState.PRESTART_COMPLETE);
    });
  }

  private setAudienceDisplay() {
    MatchFlowController.setAudiencedisplay().then(() => {
      this.props.setMatchState(MatchState.AUDIENCE_DISPLAY_SET);
    });
  }

  private startMatch() {
    MatchFlowController.startMatch().then(() => {
      this.props.setMatchState(MatchState.MATCH_IN_PROGRESS);
    });
  }

  private abortMatch() {
    MatchFlowController.abortMatch().then(() => {
      this.setState({hasPrestarted: false});
      this.props.setMatchState(MatchState.MATCH_ABORTED);
    });
  }

  private commitScores() {
    MatchFlowController.commitScores().then(() => {
      this.setState({hasPrestarted: false});
      this.props.setMatchState(MatchState.PRESTART_READY);
    });
  }

  private getAvailableTournamentLevels(postQualConfig: PostQualConfig): TournamentLevels[] {
    return ["Practice", "Qualification", postQualConfig === "elims" ? "Eliminations" : "Finals"];
  }

  private getMatchesByTournamentLevel(tournamentLevel: TournamentLevels): Match[] { // TODO - Only show fields that EMS controls
    switch (tournamentLevel) {
      case "Practice":
        return this.props.practiceMatches;
      case "Qualification":
        return this.props.qualificationMatches;
      default:
        return [];
    }
  }

  private changeSelectedLevel(event: SyntheticEvent, props: DropdownProps) {
    const matches = this.getMatchesByTournamentLevel((props.value as TournamentLevels));
    if (matches.length > 0) {
      this.setState({
        selectedLevel: (props.value as TournamentLevels),
        selectedMatch: matches[0].matchKey,
        selectedField: matches[0].fieldNumber,
      });
    } else {
      this.setState({
        selectedLevel: (props.value as TournamentLevels),
        selectedMatch: "",
        selectedField: -1,
      });
    }
  }

  private changeSelectedMatch(event: SyntheticEvent, props: DropdownProps) {
    for (const match of this.getMatchesByTournamentLevel(this.state.selectedLevel)) {
      if (match.matchKey === (props.value as string)) {
        this.setState({
          selectedMatch: match.matchKey,
          selectedField: match.fieldNumber,
        });
        break;
      }
    }
  }

  private changeSelectedField(event: SyntheticEvent, props: DropdownProps) {
    this.setState({
      selectedField: (props.value as number),
    });
  }
}

export function mapStateToProps({configState, internalState, scoringState}: IApplicationState) {
  return {
    eventConfig: configState.eventConfiguration,
    matchConfig: configState.matchConfig,
    matchState: scoringState.matchState,
    practiceMatches: internalState.practiceMatches,
    qualificationMatches: internalState.qualificationMatches
  };
}

export function mapDispatchToProps(dispatch: Dispatch<ApplicationActions>) {
  return {
    setMatchState: (matchState: MatchState) => dispatch(setMatchState(matchState))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchPlay);