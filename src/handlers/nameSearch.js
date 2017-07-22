'use strict'

const dynamos = require('../helpers/dynamoHelpers')
const helpers = require('../helpers/apiHelpers')
const moment = require('moment')
const madison = require('madison')

const responseTemplate = function (rep, callback) {
  if (!rep) {
    this.emit('MissingRep')
  } else {
    return dynamos.get(rep)
      .then((res) => {
        if (!res.Item) {
          this.emit('SearchFailure')
        } else {
          return helpers.nameSearch(res.Item.rep_id.S)
            .then(callback.bind(this))
        }
      })
      .catch((err) => {
        console.error(err)
        this.emit(':tell', 'Sorry, something went wrong.')
      })
  }
}
const nameSearchResponse = function (rep) {
  const term = `${moment(rep.termStart).format('YYYY')} to ${moment(rep.termEnd).format('YYYY')}`
  const state = madison.getStateNameSync(rep.state)
  let party

  if (rep.party === 'D') {
    party = 'a Democratic'
  } else if (rep.party === 'R') {
    party = 'a Republican'
  } else {
    party = 'an Independent'
  }

  this.attributes['speechOutput'] = `${rep.name} is ${party} ${rep.role} from ${state}. Their term is from ${term}.`
  this.emit(':tell', this.attributes['speechOutput'])
}
const termSearchResponse = function (rep) {
  const term = `${moment(rep.termStart).format('YYYY')} to ${moment(rep.termEnd).format('YYYY')}`

  this.attributes['speechOutput'] = `${rep.name}'s term is from ${term}.`
  this.emit(':tell', this.attributes['speechOutput'])
}
const twitterSearchResponse = function (rep) {
  if (rep.twitter) {
    this.attributes['speechOutput'] = `${rep.name}'s Twitter username is ${rep.twitter}.`
  } else {
    this.attributes['speechOutput'] = `${rep.name} is not on Twitter.`
  }
  this.emit(':tell', this.attributes['speechOutput'])
}
const partyRoleSearchResponse = function (rep) {
  let party

  if (rep.party === 'D') {
    party = 'a Democratic'
  } else if (rep.party === 'R') {
    party = 'a Republican'
  } else {
    party = 'an Independent'
  }

  this.attributes['speechOutput'] = `${rep.name} is ${party} ${rep.role}.`

  this.emit(':tell', this.attributes['speechOutput'])
}
const addressSearchResponse = function (rep) {
  this.attributes['speechOutput'] = `${rep.name}'s office address is ${rep.office} in Washington, DC.`

  this.emit(':tell', this.attributes['speechOutput'])
}

module.exports = {
  'NameSearchIntent': function () {
    responseTemplate.call(this, this.event.request.intent.slots.RepName.value, nameSearchResponse)
  },
  'NameSearchTermIntent': function () {
    responseTemplate.call(this, this.event.request.intent.slots.RepName.value, termSearchResponse)
  },
  'NameSearchTwitterIntent': function () {
    responseTemplate.call(this, this.event.request.intent.slots.RepName.value, twitterSearchResponse)
  },
  'NameSearchPartyRoleIntent': function () {
    responseTemplate.call(this, this.event.request.intent.slots.RepName.value, partyRoleSearchResponse)
  },
  'NameSearchAddressIntent': function () {
    responseTemplate.call(this, this.event.request.intent.slots.RepName.value, addressSearchResponse)
  },
  'MissingRep': function () {
    this.attributes['speechOutput'] = 'Sorry, I didn\'t catch that. Could you repeat the congressperson\'s name?'
    this.attributes['repromptOutput'] = this.attributes['speechOutput']

    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptOutput'])
  },
  'SearchFailure': function () {
    this.attributes['speechOutput'] = 'Sorry, I couldn\'t find a congressperson by that name.' +
    'If they are a current congressperson, try repeating their name or using a different alias of theirs.'
    this.attributes['repromptOutput'] = this.attributes['speechOutput']

    this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptOutput'])
  }
}
