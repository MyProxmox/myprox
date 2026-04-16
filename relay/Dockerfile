FROM golang:1.21-alpine AS builder

WORKDIR /build

COPY go.mod ./
COPY . .
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o relay-server ./cmd/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

COPY --from=builder /build/relay-server .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./relay-server"]
