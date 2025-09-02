import os
from plc_agent.api.server import run


def main():
    port = int(os.environ.get("AGENT_PORT", "5175"))
    host = os.environ.get("AGENT_HOST", "127.0.0.1")
    run(host=host, port=port)


if __name__ == "__main__":
    main()

