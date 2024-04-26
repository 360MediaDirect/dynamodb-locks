# DynamoDB Locks

A distributed mutex locking system based on DynamoDB

## Quick Start

```typescript
import { locks } from "@360mediadirect/dyanmodb-locks";

async function someFunc() {
  console.log("About to get a lock and do something");
  await acquire("someKey", () => {
    console.log('I am currently the only process that has "someKey" locked');
    // Thrown errors or promise rejections here will bubble up
  });
  console.log("Task completed, someKey has been released");
}
```

## Serverless Setup

### From scratch

Locks are created by issuing conditional writes and consistent reads on a DynamoDB table. Your service needs both the table, and permission to use it.

#### Resources entry to create the table

```yaml
resources:
  Resources:
    # DynamoDB table for Locks package
    LocksTable:
      Type: AWS::DynamoDB::Table
      Properties:
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
          - AttributeName: group
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
          - AttributeName: group
            KeyType: RANGE
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
        TableName: "mutex-locks-${self:provider.stage}"
        BillingMode: PAY_PER_REQUEST
```

#### Permissions

```yaml
provider:
  iam:
    role:
      statements:
        - Effect: "Allow"
          Action:
            - "dynamodb:*"
          Resource:
            - arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/mutex-locks-${self:provider.stage}
            - arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/mutex-locks-${self:provider.stage}/*
```

## Configuration

Locks can be configured by passing an object to the Locks constructor, or by setting the appropriate environment variables prior to construction.

### Configuration by object

```typescript
import { Locks } from "@360mediadirect/dyanmodb-locks";

const locks = new Locks({
  /* see options below */
});
```

### Environment variable-only setup

```typescript
import { locks, Locks } from "@360mediadirect/locks";

// If the env vars were already set by this point, "locks" is an
// already-constructed instance of Locks pre-configured using the env vars.

process.env.LOCKS_TABLE = "MyTable";
const myLocks = new Locks();

// MyLocks observes the new env var changes.
```

### Configuration options

| Config object key | Environment variable      | Default        | Description                                                                                                                                                                                               |
| ----------------- | ------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dynamodb          | _none_                    | A new instance | An instance of AWS.DynamoDB.DocumentClient to be used for all calls                                                                                                                                       |
| lockTable         | LOCKS_TABLE               | "locks-dev"    | The name of the DynamoDB table to use for lock records                                                                                                                                                    |
| heartbeatPeriodMs | LOCKS_HEARTBEAT_PERIOD_MS | 3e3            | The number of milliseconds to wait between refreshing ownership of a lock currently held                                                                                                                  |
| leaseDurationMs   | LOCKS_LEASE_DURATION_MS   | 10e3           | The number of milliseconds a lock should be held after the last heartbeat. In the event of a process crash where the lock can't be released, the lock will stay tied up until this amount of time passes. |
| retryDelayMs      | LOCKS_RETRY_DELAY_MS      | 450            | The number of milliseconds to wait between attempts to acquire a lock currently held by another process.                                                                                                  |
| maxWaitMs         | LOCKS_MAX_WAIT_MS         | 20e3           | The total number of milliseconds to wait for a lock before timing out.                                                                                                                                    |
| prefix            | LOCKS_PREFIX              | "default"      | A namespace for lock keys so they don't accidentally conflict when unrelated.                                                                                                                             |
| owner             | LOCKS_OWNER               | "Locks"        | The owner name associated with all lock records from this instance. This can be used to debug what process has which locks tied up by inspecting the DynamoDB records themselves.                         |
| debugLogs         | LOCKS_DEBUG_LOGS          | false          | Set to true (or "1" if using env var) to enable debug logging for lock events                                                                                                                             |

## Methods

### `locks.acquire(name: string, fn: LockedFunction<T>) => Promise<T>`

Acquires a lock before awaiting the supplied function. Once the function returns (if not async), resolves, or rejects, the lock is released. The returned or resolved value from the provided function will then be returned from `locks.acquire()`.

Any errors thrown or rejected will bubble up to this call, so a `try {} catch {}` block can be used to capture errors in the provided function. An error will also be thrown if the lock could not be obtained.

### `locks.child(opts: Partial<LocksOpts>) => Locks`

Creates a child instance from the current Locks instance that is configured the same way, with any provided overrides. For configuration options, see the Configuration section above.

## License

DynamoDB Locks is Copyright 360 Media Direct and is not licensed for external use, public or private, commercially or otherwise.
