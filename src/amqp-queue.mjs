import AMQPMessage from './amqp-message.mjs'
import AMQPChannel from './amqp-channel.mjs'
import AMQPConsumer from './amqp-consumer.mjs'
import AMQPError from './amqp-error.mjs'

/**
 * Convience class for queues
 */
export default class AMQPQueue {
  /**
   * @param {AMQPChannel} channel - channel this queue was declared on
   * @param {string} name - name of the queue
   */
  constructor(channel, name) {
    this.channel = channel
    this.name = name
  }

  /**
   * Bind the queue to an exchange
   * @param {string} exchange
   * @param {string} routingkey
   * @param {object} args - arguments
   * @return {Promise<self>}
   */
  bind(exchange, routingkey, args = {}) {
    const self = this
    return new Promise((resolve, reject) => {
      this.channel.queueBind(this.name, exchange, routingkey, args)
        .then(() => resolve(self))
        .catch(reject)
    })
  }

  /**
   * Delete a binding between this queue and an exchange
   * @param {string} exchange
   * @param {string} routingkey
   * @param {object} args - arguments
   * @return {Promise<self>}
   */
  unbind(exchange, routingkey, args = {}) {
    const self = this
    return new Promise((resolve, reject) => {
      this.channel.queueUnbind(this.name, exchange, routingkey, args)
        .then(() => resolve(self))
        .catch(reject)
    })
  }

  /**
   * Publish a message directly to the queue
   * @param {string|Uint8Array} body - the data to be published, can be a string or an uint8array
   * @param {object} properties - publish properties
   * @param {string} properties.contentType - mime type, eg. application/json
   * @param {string} properties.contentEncoding - eg. gzip
   * @param {object} properties.headers - custom headers, can also be used for routing with header exchanges
   * @param {number} properties.deliveryMode - 1 for transient, 2 for persisent
   * @param {number} properties.priority - between 0 and 255
   * @param {string} properties.correlationId - for RPC requests
   * @param {string} properties.replyTo - for RPC requests
   * @param {string} properties.expiration - number in milliseconds, as string
   * @param {string} properties.messageId
   * @param {Date} properties.timestamp - the time the message was generated
   * @param {string} properties.type
   * @param {string} properties.userId
   * @param {string} properties.appId
   * @return {Promise<self>} - fulfilled when the message is enqueue on the socket, or if publish confirm is enabled when the message is confirmed by the server
   */
  publish(body, properties) {
    const self = this
    return new Promise((resolve, reject) => {
      this.channel.basicPublish("", this.name, body, properties)
        .then(() => resolve(self))
        .catch(reject)
    })
  }

  /**
   * Subscribe to the queue
   * @param {object} params
   * @param {boolean} [params.noAck=true] - automatically acknowledge messages when received
   * @param {boolean} [params.exclusive=false] - be the exclusive consumer of the queue
   * @param {function(AMQPMessage) : void} callback - Function to be called for each received message
   * @return {Promise<AMQPConsumer>}
   */
  subscribe({noAck = true, exclusive = false} = {}, callback) {
    return this.channel.basicConsume(this.name, {noAck, exclusive}, callback)
  }

  /**
   * Unsubscribe from the queue
   * @param {string} consumerTag
   * @return {Promise<self>}
   */
  unsubscribe(consumerTag) {
    const self = this
    return new Promise((resolve, reject) => {
      this.channel.basicCancel(consumerTag)
        .then(() => resolve(self))
        .catch(reject)
    })
  }

  /**
   * Delete the queue
   * @return {Promise<self>}
   */
  delete() {
    const self = this
    return new Promise((resolve, reject) => {
      this.channel.queueDelete(this.name)
        .then(() => resolve(self))
        .catch(reject)
    })
  }

  /**
   * Poll the queue for messages
   * @param {object} params
   * @param {boolean} params.noAck - automatically acknowledge messages when received
   * @return {Promise<AMQPMessage?>}
   */
  get({ noAck = true}) {
    return this.channel.basicGet(this.name, { noAck })
  }
}